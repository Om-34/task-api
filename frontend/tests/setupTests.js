import { TextEncoder, TextDecoder } from 'node:util';
import '@testing-library/jest-dom';

// jsdom doesn't provide these; react-router-dom needs them at import time.
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}


// jsdom doesn't implement window.matchMedia; some libs check for it.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
