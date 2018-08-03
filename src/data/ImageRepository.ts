import * as localforage from 'localforage';

let isInitialized = false;
const initialize = () => {
  if (isInitialized) {
    return;
  }

  if (!localforage.config({
    driver: localforage.INDEXEDDB,
    version: 1.0,
    description: 'Cache for the grid images',
    name: 'GridImages'
  })) {
    throw new Error('Failed to initialize localforage');
  }

  isInitialized = true;
};

async function getUnavailableImage(): Promise<Blob> {
  const url = '/assets/ImageUnavailable.svg';
  const cachedData = await localforage.getItem<Blob>(url);
  if (cachedData) {
    return cachedData;
  }

  const response = await fetch(url);
  const responseBlob = await response.blob();
  return localforage.setItem(url, responseBlob);
}

export async function loadFromIpfsOrCache(ipfsHash: string, ipfsHost: string = 'https://ipfs.infura.io/ipfs', s3UrlBase: string = 'https://s3-us-west-2.amazonaws.com/eth-plot-data/mainnet'): Promise<Blob> {
  initialize();
  const cachedData = await localforage.getItem<Blob>(ipfsHash);

  if (cachedData) {
    console.log(`Got cached version of ${ipfsHash}`);
    return cachedData;
  }

  console.log(`Getting file from the network for ${ipfsHash}`);

  try {
    // First try to get this file from S3 which will be much faster than using IPFS
    const s3Url = `${s3UrlBase}/${ipfsHash}`;
    const response = await fetch(s3Url);
    const responseBlob = await response.blob();

    // Save the blob in the cache and return it from the cache
    return localforage.setItem(ipfsHash, responseBlob);
  } catch(e) {
    console.log(`Unable to load the image from S3, trying ipfs directly: ${e}`);
  }

  try {
    // If we don't have a cached version, we should get the image from ipfs
    const ipfsUrl = `${ipfsHost}/${ipfsHash}`;
    const response = await fetch(ipfsUrl);
    const responseBlob = await response.blob();

    // Save the blob in the cache and return it from the cache
    return localforage.setItem(ipfsHash, responseBlob);
  } catch (e) {
    console.error(`Error fetching image: ${e}`);
    return getUnavailableImage();
  }
}

