export async function loadHyperlane(feature) {
  throw new Error(
    `[starkzap] ${feature}: Hyperlane peer dependencies are omitted from the StarkShield web bundle.`,
  );
}
