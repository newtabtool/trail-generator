const express = require("express");
const puppeteer = require("puppeteer");
const app = express();
const dotenv = require("dotenv");
const { Configuration, OpenAIApi } = require("openai");
dotenv.config();

app.use(express.json());
app.listen("3001", () => {
  console.log("Server is running...");
});

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post("/", async (req, res) => {
  const theme = "matemática básica";
  //const theme = req.body.theme;
  const token = req.body.token;
  if (!token) {
    res.status(401).send("unauthorized");
  } else {
    if (token != process.env.token_) {
      res.status(401).send("unauthorized");
    }
  }
  //https://trail-generator.onrender.com/
  if (theme) {
    try {
      const prompt = `Por favor, crie uma lista de tópicos em portugues para alguém que quer aprender ${theme}. Para cada item da lista, inclua apenas o nome do tópico e separe por ! .a lista deve ser super bem detalhada. Por exemplo, se o assunto é matemática básica, a lista pode ser assim:
      Adição!Subtração!Multiplicação!Divisão
      Observação: Não envie nada além da lista`;
      
      const response = await openai
        .createCompletion({
          model: "text-davinci-003",
          prompt: prompt,
          max_tokens: parseInt(process.env.max_tokens),
          temperature: 1,
        })
        .catch((error) => {
          console.log(error);
        });
      const result_draw = await response.data.choices[0];
      const result_array = result_draw.text.split("!");

      const userId = req.id;
      const { name, type, description } = {
        name: theme,
        type: false,
        description: "",
      }; 
      const browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--single-process",
          "--no-zygote",
        ],
        executablePath:
          process.env.NODE_ENV === "production"
            ? process.env.PUPPETEER_EXECUTABLE_PATH
            : puppeteer.executablePath(),
      });

      // Abre uma nova página
      const page = await browser.newPage();
      let resp = [];
      let video = {};

      async function getVideoData(page) {

        try {
          const result = await page.evaluate(() => {
            const titleElement = document.querySelector(
              "#zci-videos > div > div.tile-wrap > div > div:nth-child(3) > div.tile__body > h6 > a"
            );
            const thumbnailElement = document.querySelector(
              "#zci-videos > div > div.tile-wrap > div > div:nth-child(3) > div.tile__media > img"
            );
            const urlElement = document.querySelector(
              "#zci-videos > div > div.tile-wrap > div > div:nth-child(3)"
            );

            const title = titleElement ? titleElement.textContent : "";
            const thumbnail = thumbnailElement ? thumbnailElement.src : "";
            const url = urlElement ? urlElement.getAttribute("data-link") : "";

            return {
              title: title,
              thumbnail: thumbnail,
              url: url,
            };
          });


          const relateds = [];
          for (let i = 0; i < 5; i++) {
            const related = await page.evaluate((index) => {
              const element = document.querySelector(
                `#zci-videos > div > div.tile-wrap > div > div:nth-child(${
                  index + 3
                }) > div.tile__body > h6 > a`
              );
              const title = element ? element.textContent : "";

              const urlElement = document.querySelector(
                `#zci-videos > div > div.tile-wrap > div > div:nth-child(${
                  index + 3
                })`
              );
              const url = urlElement
                ? urlElement.getAttribute("data-link")
                : "";


              return {
                title: title,
                url: url,
                channel: "Trilha gerada automaticamente",
              };
            }, i);

            relateds.push(related);
          }

          return {
            title: result.title,
            thumbnail: result.thumbnail,
            url: result.url,
            relateds: relateds,
          };
        } catch (error) {
          console.log("Erro ao obter dados do vídeo:", error);
          return null;
        }
      }

      for (const result of result_array) {
        //console.log("termo de busca: " + result);

        try {
          await page.goto("https://duckduckgo.com/");
          await page.waitForSelector("#search_form_input_homepage");
          await page.type(
            "#search_form_input_homepage",
            theme + " " + result + " portugues site:youtube.com"
          );
          await page.keyboard.press("Enter");
          await page.waitForSelector("#duckbar_static > li:nth-child(3) > a");
          await page.waitForNavigation();
          await page.click("#duckbar_static > li:nth-child(3) > a");
          await page.waitForSelector(
            "#zci-videos > div > div.tile-wrap > div > div:nth-child(3) > div.tile__body > h6 > a"
          );
          
          const videoData = await getVideoData(page);
          console.log(videoData);
          const { title, thumbnail, url, relateds } = videoData;
                const video = {
                  title: title,
                  thumbnail: thumbnail,
                  url: url,
                  channel: "Visite o vídeo para ver o canal",
                  relateds: relateds,
                };
          resp.push(video);
          
        } catch (error) {
          console.log("Erro durante a busca:", error);
        }
      }

      await browser.close();
      console.log("finalizado");

      res.json({ resp });
      // console.log(result);
      //}
    } catch (error) {
      console.log(error);
    }
  } else {
    res.status(400).json({ error: "Tema não informado" });
  }
});
