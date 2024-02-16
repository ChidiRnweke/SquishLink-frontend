import { getElementOrThrow } from 'safe-query'

type Handler = { shorten(input: string): Promise<ShortenResponse> }

type ShortenResponse = { success: boolean, body: string }

const fetchHandler = {
  url: "https://chidinweke.be/s",
  shorten: async (inputLink: string): Promise<ShortenResponse> => {
    try {
      const res = await fetch(fetchHandler.url, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: inputLink })
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      return { success: true, body: data.link || JSON.stringify(data) };
    } catch (error) {
      return { success: false, body: error instanceof Error ? error.message : "An unknown error occurred" };
    }
  }
};


const echoHandler: Handler = {
  shorten: async (input: string) => Promise.resolve({ success: true, body: input })
};
const html = /*html*/`
<style>

  section {
    padding: 2rem;
    color: var(--foreground-color);
    max-width: 100%;
    box-sizing: border-box;
  }

  .input-group {
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 3fr 1fr;
    align-items: center;
    max-width: 100%;
    box-sizing:border-box;
    gap: 0.5rem;
    max-width: 100%;
  }

  input {
    border: 1px solid var(--subtle-color);
    border-radius: 5px;
    max-width: 100%;
    font-size: 1;
    padding-top: 0.7rem;
    padding-bottom: 0.7rem
  }

  ::placeholder {
  color: var(--primary-color);
  opacity: 1; 
  text-align:center;
  padding-top: 0.7rem;
  padding-bottom: 0.7rem
}

::-ms-input-placeholder { 
color: var(--primary-color);
  text-align:center;

}

  button {
    cursor: pointer;
    background-color: var(--primary-color); 
    color: var(--background-color); 
    border: none;
    border-radius: 5px;
    font-weight: 300; 
    transition: background-color 0.3s, transform 0.2s;
    max-width: 100%;
    padding: 0.7rem 0.7rem;
  }

  button:disabled {
    background-color: var(--subtle-color);
    cursor:help;
  }

  button:hover {
    background-color: var(--accent-color);
    transform: translateY(-2px);
  }

  output {
    display: none;
    margin-top: 0.7rem;
    background-color: var(--background-color);
    padding: 0.5rem;
    border-radius: 5px;
    border: 1px solid var(--subtle-color);
  }

  .revealed {
    display: block
  }

  .error {
    color: var(--error-color);
  }


  @media (min-width: 750px) {
    input {
    font-size:1.3rem;
 }
 button {
    padding: 0.7rem 1.2rem;
    font-size:1.3rem;
 }  }

@media (min-width: 1100px) {
 input {
    font-size:1.6rem;
 }
 button {
    padding: 0.7rem 1.2rem;
    font-size:1.6rem;
 }


}
</style>

<section>
  <label for="link-input">Squish your link here.</label>
  <div class="input-group">
    <input type="text" id="link-input" placeholder="chidinweke.be">
    <button type="button" disabled>Squish</button>
  </div>
  <output></output>
  </section>
`


class LinkShortener extends HTMLElement {
  handler: Handler;
  private linkValidator: RegExp;
  public constructor() {
    super()
    this.linkValidator = new RegExp("([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?");
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.innerHTML = html;
    this.handler = this.getHandler();
  }

  public connectedCallback() {
    this.addEventListeners();
  }

  private getHandler(): Handler {
    const handlerName = this.getAttribute('data-handler') ?? "echoHandler";
    const handler = this.nameToHandler(handlerName);
    return handler;
  }

  private addEventListeners() {
    const button = getElementOrThrow<HTMLButtonElement>(this.shadowRoot!, "button");
    const input = getElementOrThrow<HTMLInputElement>(this.shadowRoot!, "input");
    input.addEventListener("input", () => button.disabled = !this.linkValidator.test(input.value))

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        if (!button.disabled) {
          this.submitData(input.value.trim());
        }
      }
    })
    button.addEventListener("click", async () => this.submitData(input.value));
  }


  private async submitData(input: string): Promise<void> {
    const response = await this.handler.shorten(input);
    this.renderResult(response);
  }

  private renderResult(response: ShortenResponse): void {
    const output = getElementOrThrow<HTMLOutputElement>(this.shadowRoot!, "output");
    if (!response.success) {
      output.classList.add("error")
    } else {
      output.classList.remove("error")
    }
    output.textContent = response.body;
    output.classList.add("revealed");
  }

  private nameToHandler(handlerName: string): Handler {
    if (handlerName == "fetch") {
      return fetchHandler
    }
    else if (handlerName == "echoHandler") {
      return echoHandler
    }
    else {
      throw Error("Invalid handler, only fetch and echoHandler are supported.")
    }
  }
}