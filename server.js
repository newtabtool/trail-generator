const express = require("express");
const app = express();
const dotenv = require("dotenv");
const { Configuration, OpenAIApi } = require("openai");
const axios = require("axios");
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
      
      
     
      let video = {}; 
      let resp = [];

      console.time("total");

      for (const result of result_array) {
        const encodedResult = encodeURIComponent(result);
        const url = `https://www.googleapis.com/customsearch/v1/siterestrict?key=${process.env.search_key}&cx=64f984679f0bb4d4c&q=${encodedResult}`;
;
        await axios
          .get(url)
          .then((response) => {
            const video_name = response.data.items[0].title;
            const video_url = response.data.items[0].link;
            const video_thumbnail =
              response.data.items[0].pagemap.cse_thumbnail[0].src;

            const relateds = []; // Array para armazenar os vídeos relacionados

            for (let i = 1; i <= 4; i++) {
              try {
                
                if (response.data.items[i].pagemap.person[0].name) {
                  const related_video_name = response.data.items[i].title;
                  const related_video_url = response.data.items[i].link;
                  const related_video_channel =
                  response.data.items[i].pagemap.person[0].name;
                  
                  const related_video = {
                    title: related_video_name,
                    url: related_video_url,
                    channel: related_video_channel,
                  };
                  
                  relateds.push(related_video); // Adicionar vídeo relacionado ao array
                }
              } catch (error) {
                
              }
            }

             video = {
              title: video_name,
              url: video_url,
              thumbnail: video_thumbnail,
              relateds: relateds,
            };
            resp.push(video);
          })
          .catch((error) => {
            console.error(error);
          });
      }
      console.timeEnd("total");
      console.log("finalizado");
      console.log("Resposta: \n", resp);
      res.json({ resp });
    } catch (error) {
      console.log(error);
    }
  } else {
    res.status(400).json({ error: "Tema não informado" });
  }
});
