import { Application, Router } from "https://deno.land/x/oak@v16.1.0/mod.ts";

const router = new Router();

router.get("/", (ctx) => {
  ctx.response.body = "Hello world";
});

const thumbnailResolutions = [
  "maxresdefault", // 1280x720 - may not be available for 720p videos
  "sddefault", // 640x480
  "hqdefault", // 480x360
  "mqdefault", // 320x180
  "default", // 120x90
];

router.get("/:videoId.jpg", async (ctx) => {
  const videoId = ctx.params.videoId;
  for (const resolution of thumbnailResolutions) {
    const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/${resolution}.jpg`;
    const response = await fetch(thumbnailUrl);
    if (response.status === 200 && response.body) {
      // respond with the image
      const reader = response.body.getReader();
      const contentType = response.headers.get("content-type") || "image/jpeg";
      ctx.response.headers.set("content-type", contentType);
      ctx.response.body = new ReadableStream({
        async start(controller) {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              break;
            }
            controller.enqueue(value);
          }
        },
      });

      return;
    }
  }
});

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

app.listen({
  port: 8000,
});
