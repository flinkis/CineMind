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
 * Creates a text representation from title and overview, then gets embedding
 */
export async function computeMovieEmbedding(movie) {
  try {
    // Create text representation of the movie
    const text = `${movie.title}. ${movie.overview || ''}`.trim();

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
    throw new Error(`Failed to compute embedding: ${error.message}`);
  }
}

/**
 * Compute average embedding (user taste vector)
 * Takes an array of embeddings and returns their average
 */
export function computeAverageEmbedding(embeddings) {
  if (!embeddings || embeddings.length === 0) {
    return null;
  }

  const dimension = embeddings[0].length;
  const average = new Array(dimension).fill(0);

  for (const embedding of embeddings) {
    for (let i = 0; i < dimension; i++) {
      average[i] += embedding[i];
    }
  }

  for (let i = 0; i < dimension; i++) {
    average[i] /= embeddings.length;
  }

  return average;
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

