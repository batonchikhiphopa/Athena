import { createApp } from "./app.js";
import { HOST, PORT } from "./config/env.js";

const app = createApp();

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
