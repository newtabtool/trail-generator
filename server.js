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
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--single-process", "--no-zygote"],
  executablePath: process.env.NODE_ENV === "production" ? process.env.PUPPETEER_EXECUTABLE_PATH : puppeteer.executablePath(),
});

const resp = await Promise.all(result_array.map(async (result) => {
  try {
    const page = await browser.newPage();
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
    const thumbnailElement = await page.$(
      "#zci-videos > div > div.tile-wrap > div > div:nth-child(3) > div.tile__media > img"
    );
    const thumbnail = await page.evaluate(
      (thumbnailElement) => thumbnailElement.src,
      thumbnailElement
    );
    const urlElement = await page.$(
      "#zci-videos > div > div.tile-wrap > div > div:nth-child(3)"
    );
    const url = await page.evaluate(
      (urlElement) => urlElement.getAttribute("data-link"),
      urlElement
    );
    let relateds = [];
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
    await page.close();
    return {
      url: url,
      thumbnail: thumbnail,
      title: title,
      channel: "Visite o video para ver o canal",
      relateds: relateds
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}));

await browser.close();
      
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
