export default function Page() {
  // Lazy import avoids SSR hiccups while keeping it client-side
  const TokenLoyalty = require("./components/TokenLoyalty").default;
  return <TokenLoyalty />;
}
