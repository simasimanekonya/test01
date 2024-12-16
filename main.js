// Response for Uptime Robot
const http = require("http");
http
  .createServer(function (request, response) {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("Discord bot is active now \n");
  })
  .listen(3000);

// Discord bot implements
const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // サーバー情報にアクセス
    GatewayIntentBits.GuildMessages, // メッセージ送受信イベント
    GatewayIntentBits.MessageContent, // メッセージ内容にアクセス
  ],
});

client.on("ready", () => {
  // botのステータス表示
  client.user.setPresence({ activities: [{ name: "discordとline連携" }] });
  console.log("bot is ready!");
});

client.on("messageCreate", (message) => {
  // bot(自分)のメッセージには反応しない
  if (message.author.bot) {
    return;
  }
  // DMには応答しない
  if (message.channel.type === "dm") {
    return;
  }

  var msg = message;

  // botへのリプライは無視
  if (message.mentions.has(client.user)) {
    return;
  } else {
    // GASにメッセージを送信
    sendGAS(msg);
    return;
  }

  function sendGAS(msg) {
    // LINE Messaging API風の形式に仕立てる(GASでの場合分けが楽になるように)
    var jsonData = {
      events: [
        {
          type: "discord",
          name: message.author.username,
          message: message.content,
        },
      ],
    };
    //GAS URLに送る
    post(process.env.GAS_URL, jsonData);
  }

  function post(url, data) {
    //requestモジュールを使う
    const request = require("request");
    const options = {
      uri: url,
      headers: { "Content-type": "application/json" },
      json: data,
      followAllRedirects: true,
    };
    // postする
    request.post(options, function (error, response, body) {
      if (error != null) {
        msg.reply("更新に失敗しました");
        return;
      }

      const userid = response.body.userid;
      const channelid = response.body.channelid;
      const message = response.body.message;
      if (
        userid != undefined &&
        channelid != undefined &&
        message != undefined
      ) {
        const channel = client.channels.cache.get(channelid);
        if (channel != null) {
          channel.send(message);
        }
      }
    });
  }
});

if (process.env.DISCORD_BOT_TOKEN == undefined) {
  console.log("please set ENV: DISCORD_BOT_TOKEN");
  process.exit(0);
}

client.login(process.env.DISCORD_BOT_TOKEN);
