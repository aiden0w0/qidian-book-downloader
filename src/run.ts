import {
  CommandLineAction,
  CommandLineFlagParameter,
  CommandLineIntegerParameter,
  CommandLineStringParameter,
} from "@rushstack/ts-command-line";
import * as fs from "fs";
import * as playwright from "playwright-core";
import { Downloader, IArticleInformation } from "./downloader";

export class RunAction extends CommandLineAction {
  private noChromeHeadless: CommandLineFlagParameter;
  private useCookieLogin: CommandLineFlagParameter;
  private ywguid: CommandLineStringParameter;
  private ywkey: CommandLineStringParameter;
  private username: CommandLineStringParameter;
  private password: CommandLineStringParameter;
  private bookId: CommandLineIntegerParameter;

  public constructor() {
    super({
      actionName: "run",
      documentation: "Run the downloading process.",
      summary: "Run the downloading process.",
    });
  }

  protected async onExecute() { // abstract
    const browser = await playwright.chromium.launch({
      headless: !this.noChromeHeadless.value,
    });
    try {
      await this.run(browser);
    } finally {
      browser.close();
    }
  }

  protected onDefineParameters(): void { // abstract
    this.noChromeHeadless = this.defineFlagParameter({
      description: "Launch Chrome/Chromium browser not in headless mode.",
      parameterLongName: "--no-chrome-headless",
    });
    this.useCookieLogin = this.defineFlagParameter({
      description: "Use cookie to login.",
      parameterLongName: "--cookie",
      parameterShortName: "-c",
    });
    this.ywguid = this.defineStringParameter({
      argumentName: "YWGUID",
      description: "The ywguid field.",
      parameterLongName: "--ywguid",
    });
    this.ywkey = this.defineStringParameter({
      argumentName: "YWKEY",
      description: "The ywkey field.",
      parameterLongName: "--ywkey",
    });
    this.username = this.defineStringParameter({
      argumentName: "USERNAME",
      description: "The username of your account in QiDian.",
      parameterLongName: "--username",
      parameterShortName: "-u",
    });
    this.password = this.defineStringParameter({
      argumentName: "PASSWORD",
      description: "The password of your account in QiDian.",
      parameterLongName: "--password",
      parameterShortName: "-p",
    });
    this.bookId = this.defineIntegerParameter({
      argumentName: "BOOK_ID",
      description: "ID of the book you want to download from QiDian.",
      parameterLongName: "--book",
      parameterShortName: "-i",
    });
  }

  private async run(browser: playwright.Browser) {
    const downloader = new Downloader(browser, {
      useCookieLogin: this.useCookieLogin.value,
      bookId: this.bookId.value,
      ywguid: this.ywguid.value,
      ywkey: this.ywkey.value,
      password: this.password.value,
      username: this.username.value,
    });
    const article = await downloader.run();

    fs.writeFileSync(`./${article.title}.html`, this.articleToString(article));
  }

  private articleToString(article: IArticleInformation): string {
    return `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="zh-hans" xml:lang="zh-hans">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
  <meta name="author" content="${article.author}" />
  <title>${article.title}</title>
</head>
<body>`
      + article.sections.map((s) => {
        return `<h1>${s.title}</h1>
` + s.subsections.map((ss) => {
          return `<h2>${ss.title}</h2>
` + ss.contentHtml;
        }).join("");
      }).join("")
      + `</body>
</html>
`;
  }
}
