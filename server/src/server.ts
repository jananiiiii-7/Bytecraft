import { app } from "./app";
import { env } from "./utils/env";

const port = Number(env.PORT);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
