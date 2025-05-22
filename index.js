const puppeteer = require("puppeteer");
const fetch = require("node-fetch");

const SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/xxxxx/yyyyy/zzzzz"; // ← 自分のに差し替えて！

const targets = [
  {
    name: "Syncad",
    url: "https://syncad.jp/news/",
    selector: ".elementor-post__title a"
  },
  {
    name: "PR TIMES",
    url: "https://prtimes.jp/topics/keywords/Web%E5%BA%83%E5%91%8A",
    selector: ".list .listTitle a"
  },
  {
    name: "MarkeZine",
    url: "https://markezine.jp/news",
    selector: ".title a"
  },
  {
    name: "Web担当者Forum",
    url: "https://webtan.impress.co.jp/list/story_news/2760",
    selector: ".title a"
  }
];

(async () => {
  const browser = await puppeteer.launch({
  headless: "new",
  executablePath: "/usr/bin/chromium-browser",
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});

  const page = await browser.newPage();
  let message = "📰 *今日のWebマーケティングニュースまとめ*\n";

  for (const target of targets) {
    try {
      await page.goto(target.url, { waitUntil: "networkidle2", timeout: 30000 });
      await page.waitForSelector(target.selector, { timeout: 10000 });

      const articles = await page.$$eval(target.selector, (elements) =>
        elements.slice(0, 2).map((el) => ({
          title: el.textContent.trim(),
          url: el.href
        }))
      );

      message += `\n📌 *${target.name}*\n`;
      for (const article of articles) {
        message += `• ${article.title}\n${article.url}\n`;
      }

    } catch (e) {
      message += `⚠️ ${target.name} の取得に失敗しました（${e.message}）\n`;
    }
  }

  await fetch(SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message })
  });

  await browser.close();
})();
