import { createApp } from "./app.js";

const port = process.env.PORT ?? 5000;

const app = createApp();

app.listen(port, () => {
  console.log(`Raazia backend listening on port ${port}`);
});
