# Hacettepe AI

Hacettepe AI is a dedicated AI assistant for Hacettepe University students, built with React. It leverages advanced technologies like Retrieval-Augmented Generation (RAG) and the Claude 3 Haiku model to provide fast, accurate, and reliable information. This project is designed to help students easily access university-related information.

The chatbot can answer queries related to Hacettepe University by utilizing the Claude 3 Haiku model and the scraped data from the university's website. Users can ask questions in their preferred language, and the chatbot will respond accordingly.

I used [Crawl4AI](https://github.com/unclecode/crawl4ai) to scrape the website of Hacettepe.

Try it [**here**](https://hacettepe-ai-hou3z.ondigitalocean.app/).

## Features

- **Fast Responses**: Utilizes RAG technology to ensure responses are quick and based on relevant context.
- **Accurate Information**: Powered by the Gemini 2.5 Flash model, responses are generated using scraped data from Hacettepe University's website.
- **Language Support**: Supports English and Turkish, allowing users to switch languages seamlessly.
- **Persistent Language Settings**: Remembers the user's language preference across sessions.

## Tech Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: AWS Lambda, API Gateway, Pinecone, OpenRouter

## Contact

For any questions or feedback, feel free to reach out:

- [**LinkedIn**](https://www.linkedin.com/in/ufuk-tanr%C4%B1verdi-91a503264/)
- [**GitHub**](https://github.com/UfukTanriverdi8)


## TO DO (I hope I'll be back :/)
- [ ] markdown and newlines need to be rendered when displaying the response
- [ ] auto scroll to bottom not working after the typewriter effect
- [ ] cors allowed origin
- [X] title typewriter effect
- [ ] feedback button