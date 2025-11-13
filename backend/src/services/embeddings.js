import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Embeddings service
 * Handles computing embeddings for movies using OpenAI's text-embedding-ada-002 model
 */

/**
 * Compute embedding for a movie
 * Creates a rich text representation from title, overview, genres, keywords, cast, directors, and writers
 * @param {Object} movie - Movie object (can be formatted movie data or full TMDB response)
 * @param {Object} tmdbMovie - Optional full TMDB movie response with credits, keywords, etc.
 */
export async function computeMovieEmbedding(movie, tmdbMovie = null) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured in environment variables');
    }

    // Build rich text representation
    const parts = [];

    // Title (always present)
    parts.push(movie.title || '');

    // Overview
    if (movie.overview) {
      parts.push(movie.overview);
    }

    // Use full TMDB data if available, otherwise use what's in movie object
    const fullData = tmdbMovie || movie;

    // Genres
    if (fullData.genres && Array.isArray(fullData.genres) && fullData.genres.length > 0) {
      const genreNames = fullData.genres.map(g => g.name || g).join(', ');
      parts.push(`Genres: ${genreNames}`);
    }

    // Keywords
    if (fullData.keywords && fullData.keywords.keywords) {
      const keywordNames = fullData.keywords.keywords
        .slice(0, 10) // Limit to top 10 keywords
        .map(k => k.name || k)
        .join(', ');
      if (keywordNames) {
        parts.push(`Keywords: ${keywordNames}`);
      }
    } else if (fullData.keywords && Array.isArray(fullData.keywords)) {
      const keywordNames = fullData.keywords
        .slice(0, 10)
        .map(k => k.name || k)
        .join(', ');
      if (keywordNames) {
        parts.push(`Keywords: ${keywordNames}`);
      }
    }

    // Directors
    if (fullData.credits && fullData.credits.crew) {
      const directors = fullData.credits.crew
        .filter(person => person.job === 'Director')
        .slice(0, 3) // Top 3 directors
        .map(d => d.name);
      if (directors.length > 0) {
        parts.push(`Directed by: ${directors.join(', ')}`);
      }
    }

    // Writers
    if (fullData.credits && fullData.credits.crew) {
      const writerJobs = ['Writer', 'Screenplay', 'Story', 'Novel', 'Characters', 'Teleplay'];
      const writers = fullData.credits.crew
        .filter(person => writerJobs.includes(person.job))
        .slice(0, 5) // Top 5 writers
        .map(w => w.name);
      // Remove duplicates
      const uniqueWriters = [...new Set(writers)];
      if (uniqueWriters.length > 0) {
        parts.push(`Written by: ${uniqueWriters.join(', ')}`);
      }
    }

    // Top cast members (main actors)
    if (fullData.credits && fullData.credits.cast) {
      const topCast = fullData.credits.cast
        .slice(0, 5) // Top 5 cast members
        .map(actor => actor.name);
      if (topCast.length > 0) {
        parts.push(`Starring: ${topCast.join(', ')}`);
      }
    }

    // Tagline (if available)
    if (fullData.tagline) {
      parts.push(`Tagline: ${fullData.tagline}`);
    }

    // Combine all parts
    const text = parts.filter(part => part.trim()).join('. ').trim();

    if (!text) {
      throw new Error('Movie must have at least a title');
    }

    // Get embedding from OpenAI
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    const embedding = response.data[0].embedding;
    return embedding;
  } catch (error) {
    console.error('OpenAI embedding error:', error.message);
    console.error('OpenAI error details:', error);

    // Extract error details from OpenAI SDK
    const statusCode = error.status || error.statusCode || error.response?.status;
    const errorMessage = error.message || '';
    const errorCode = error.code || error.type;

    // Check for quota/billing errors (429 status or quota in message)
    if (statusCode === 429 || errorMessage.includes('quota') || errorMessage.includes('billing') || errorMessage.includes('exceeded')) {
      const quotaError = new Error('OpenAI API quota exceeded. Please check your plan and billing details at https://platform.openai.com/account/billing');
      quotaError.status = 429;
      quotaError.statusCode = 429;
      quotaError.code = 'QUOTA_EXCEEDED';
      throw quotaError;
    }

    // Check for authentication errors (401 status)
    if (statusCode === 401 || errorMessage.includes('Invalid API key') || errorMessage.includes('authentication')) {
      const authError = new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY in the .env file');
      authError.status = 401;
      authError.statusCode = 401;
      authError.code = 'AUTH_ERROR';
      throw authError;
    }

    // Handle other OpenAI API errors
    if (error.response) {
      console.error('OpenAI API response:', error.response.data);
      const apiError = new Error(`OpenAI API error: ${error.response.data.error?.message || errorMessage}`);
      apiError.status = error.response.status;
      apiError.statusCode = error.response.status;
      apiError.code = error.response.data.error?.code || errorCode || 'API_ERROR';
      throw apiError;
    }

    // Handle OpenAI SDK errors
    if (error.status || error.code) {
      const sdkError = new Error(`OpenAI API error: ${errorMessage}`);
      sdkError.status = statusCode;
      sdkError.statusCode = statusCode;
      sdkError.code = errorCode || 'API_ERROR';
      throw sdkError;
    }

    // Generic error
    const genericError = new Error(`Failed to compute embedding: ${errorMessage}`);
    genericError.status = 500;
    genericError.statusCode = 500;
    throw genericError;
  }
}

/**
 * Compute average embedding (user taste vector)
 * Takes an array of embeddings and returns their normalized average
 * The result is normalized to a unit vector for consistent cosine similarity calculations
 */
export function computeAverageEmbedding(embeddings) {
  if (!embeddings || embeddings.length === 0) {
    return null;
  }

  const dimension = embeddings[0].length;
  const average = new Array(dimension).fill(0);

  // Compute average
  for (const embedding of embeddings) {
    for (let i = 0; i < dimension; i++) {
      average[i] += embedding[i];
    }
  }

  for (let i = 0; i < dimension; i++) {
    average[i] /= embeddings.length;
  }

  // Normalize to unit vector to maintain proper cosine similarity
  // This ensures the magnitude doesn't affect similarity scores
  const norm = Math.sqrt(average.reduce((sum, val) => sum + val * val, 0));
  if (norm > 0.0001) {
    for (let i = 0; i < dimension; i++) {
      average[i] = average[i] / norm;
    }
  }

  return average;
}

/**
 * Compute refined taste vector that accounts for both likes and dislikes
 * Formula: refined_vector = liked_vector - (dislike_weight * disliked_vector)
 * This pushes the taste vector away from disliked content
 * 
 * @param {Array} likedEmbeddings - Array of liked movie embeddings
 * @param {Array} dislikedEmbeddings - Array of disliked movie embeddings
 * @param {number} dislikeWeight - Weight for dislikes (default: 0.5, range: 0-1)
 * @returns {Array|null} Refined taste vector or null if no likes
 */
export function computeRefinedTasteVector(likedEmbeddings, dislikedEmbeddings = [], dislikeWeight = 0.5) {
  // Start with average of liked embeddings
  const likedVector = computeAverageEmbedding(likedEmbeddings);

  if (!likedVector) {
    return null;
  }

  // If no dislikes, just return the liked vector
  if (!dislikedEmbeddings || dislikedEmbeddings.length === 0) {
    return likedVector;
  }

  // Compute average of disliked embeddings
  const dislikedVector = computeAverageEmbedding(dislikedEmbeddings);

  if (!dislikedVector) {
    return likedVector;
  }

  // Ensure vectors have same dimension
  if (likedVector.length !== dislikedVector.length) {
    console.warn('Liked and disliked embeddings have different dimensions, using liked vector only');
    return likedVector;
  }

  // Compute refined vector: liked - (weight * disliked)
  // This pushes the vector away from disliked content
  const refinedVector = new Array(likedVector.length);
  for (let i = 0; i < likedVector.length; i++) {
    refinedVector[i] = likedVector[i] - (dislikeWeight * dislikedVector[i]);
  }

  // Normalize the refined vector to maintain proper cosine similarity calculations
  // This ensures the vector magnitude doesn't affect similarity scores
  const norm = Math.sqrt(refinedVector.reduce((sum, val) => sum + val * val, 0));
  if (norm > 0.0001) {
    // Normalize to unit vector
    for (let i = 0; i < refinedVector.length; i++) {
      refinedVector[i] = refinedVector[i] / norm;
    }
  } else {
    // If norm is too small, fall back to liked vector
    console.warn('Refined taste vector norm too small, using liked vector only');
    return likedVector;
  }

  return refinedVector;
}

/**
 * Compute cosine similarity between two embeddings
 * Returns a value between -1 and 1, where 1 is most similar
 */
export function cosineSimilarity(embedding1, embedding2) {
  if (!embedding1 || !embedding2) {
    return 0;
  }

  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same dimension');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  return dotProduct / (norm1 * norm2);
}

/**
 * Parse embedding from JSON string
 */
export function parseEmbedding(embeddingString) {
  try {
    return JSON.parse(embeddingString);
  } catch (error) {
    console.error('Failed to parse embedding:', error);
    return null;
  }
}

/**
 * Stringify embedding to JSON string for storage
 */
export function stringifyEmbedding(embedding) {
  return JSON.stringify(embedding);
}

