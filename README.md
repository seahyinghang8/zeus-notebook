# Zeus Notebook

An IPython notebook that runs completely in your browser with Pyodide, with a GPT copilot. The chat interface allows users to seamlessly move code from the notebook to the chat to ask questions and vice versa, make coding more accessible to everyone.

## Demo

[Try out Zeus Notebook](https://zeusnotebook.com)

https://user-images.githubusercontent.com/7028464/232592844-ee1266be-0729-43ed-a5ba-7c7f38dc600b.mov

[Youtube link](https://youtu.be/6XMwHDJHaqA)

Note: Video was recorded at 2x speed with some of the loading time cut out for smoother demo.

## Major Tools
SvelteKit, Tailwind, DaisyUI, CodeMirror, Pyodide, OpenAI

## Future Work
There are probably a bunch of bugs that I've missed while hacking at 2am in the morning. Streaming outputs from openai gpt instead of waiting for the one entire request would greatly improve the user experience. There are also some stylistic inconsistencies to be fixed. Rendering HTML and Latex output from python would also be great. Since this was done as a hackathon, code organization is not the best and notebook logic can definitely be improved. Pyodide can also be hacked so that it can be terminated if the process is taking too long.

### Notes
This is done as a hackathon project for Svelte Hackathon. Development is fully done with Chrome. Compatibility with other browsers are not tested. API key is stored locally on the browser with local storage. 
