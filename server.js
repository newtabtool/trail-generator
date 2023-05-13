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
  const theme = req.body.theme;
  const token = req.body.token
  console.log(token)
  console.log(process.env.token_)
  if(!token){
    res.status(401).send("unauthorized")
  }else{
    if(token != process.env.token_){
      res.status(401).send("unauthorized")
    }
  }
  //https://trail-generator.onrender.com/
  if (theme) {
    try {
       const prompt = `Por favor, crie uma lista de tópicos para alguém que quer aprender ${theme}. Para cada item da lista, inclua apenas o nome do tópico e separe por ! . O objetivo é a lista ser bem detalhada. Por exemplo, se o assunto é matemática básica, a lista pode ser assim:
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
        headless: true,
        args: ["--no-sandbox"],
      });

      // Abre uma nova página
      const page = await browser.newPage();
      let resp = []
      let video = {}
      for (const result of result_array) {
        try {
          console.log("recomeçou");
          await page.goto("https://duckduckgo.com/");
          await page.waitForSelector("#search_form_input_homepage");
          await page.type(
            "#search_form_input_homepage",
            theme + " " + result + " site:youtube.com"
          );
          await page.click("#search_button_homepage");
          await page.waitForSelector("#duckbar_static > li:nth-child(3) > a");
          await page.click("#duckbar_static > li:nth-child(3) > a");
          await page.waitForSelector(
            "#zci-videos > div > div.tile-wrap > div > div:nth-child(3) > div.tile__body > h6 > a"
          );
          const element = await page.$(
            "#zci-videos > div > div.tile-wrap > div > div:nth-child(3) > div.tile__body > h6 > a"
          );
          const title = await page.evaluate(
            (element) => element.textContent,
            element
          );
          //console.log("Texto do elemento:", title);
          const thumbnailElement = await page.$(
            "#zci-videos > div > div.tile-wrap > div > div:nth-child(3) > div.tile__media > img"
          );
          thumbnail = await page.evaluate(
            (thumbnailElement) => thumbnailElement.src,
            thumbnailElement
          );
          //console.log("URL da thumbnail: " + thumbnail);
          const urlElement = await page.$(
            "#zci-videos > div > div.tile-wrap > div > div:nth-child(3)"
          );
          url = await page.evaluate(
            (urlElement) => urlElement.getAttribute("data-link"),
            urlElement
          );
          //console.log("URL do video: " + url);

          let relateds = [];
            video.url = url
            video.thumbnail = thumbnail
            video.title = title
            video.channel = "Visite o video para ver o canal"

          for (let i = 0; i < 5; i++) {
            const element = await page.$(
              `#zci-videos > div > div.tile-wrap > div > div:nth-child(${
                i + 3
              }) > div.tile__body > h6 > a`
            );
            const title = await page.evaluate(
              (element) => element.textContent,
              element
            );
           
            const urlElement = await page.$(
              `#zci-videos > div > div.tile-wrap > div > div:nth-child(${
                i + 3
              })`
            );
            const url = await page.evaluate(
              (urlElement) => urlElement.getAttribute("data-link"),
              urlElement
            );

            const related = {
              title: title,
              url: url,
            };

            relateds.push(related);
          }
          video.relateds = relateds
          console.log("video: "+video+"\n \n \n");
          resp.push(video)

        } catch (error) {}
      }
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
