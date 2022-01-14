const TelegramBot = require('node-telegram-bot-api'); // подключаем node-telegram-bot-api
const Captcha = require("@haileybot/captcha-generator");

const token = '5076390048:AAG1Hl1aVGFNFF00tJ6qI0k5DjkahzuIhRI';
// включаем самого бота
const bot = new TelegramBot(token, { polling: true });

let chats = {};

const keyboard = [
  [
    {
      text: 'Website',
      url: 'https://axelar.network/'
    },
    {
      text: 'Discord',
      url: 'https://discord.gg/aRZ3Ra6f7D'
    },
  ],
  [{
    text: 'Axelar Community Telegram',
    url: 'https://t.me/axelarcommunity'
  },
  {
    text: 'Twitter',
    url: 'https://twitter.com/axelarcore'
  }]
];
const docsKeyboard = [
  [
    {
      text: 'Whitepaper',
      url: 'https://axelar.network/wp-content/uploads/2021/07/axelar_whitepaper.pdf'
    },
  ],
  [
    {
      text: 'Developer Documentation',
      url: 'https://docs.axelar.dev/#/'
    },
  ],
  [
    {
      text: 'Community Managed Axelar Academy',
      url: 'https://axelar.academy/'
    },
  ],
];

bot.setMyCommands([
  { command: '/start', description: "Initial greeting" },
  { command: '/about', description: "What is Axelar?" },
  { command: '/sendmelinks', description: "Send me community links" },
  { command: '/faq_docs', description: "Send me Axelar documentation please" },
])
bot.on('new_chat_members', (msg) => {
  console.log(msg)
  const chatId = msg.chat.id;
  const userId = msg.new_chat_participant.id;
  const msgId = msg.message_id;
  // if(msg.chat.id != "-1001458873048") {
  //   return bot.leaveChat(chatId);
  // }
  if (!chats[msg.new_chat_member.id]) {
    chats[msg.new_chat_member.id] = {};
  }
  bot.deleteMessage(chatId, msgId);
  bot.sendMessage(chatId, `Please, <a href="https://t.me/AxelarCoreBot?start=${chatId}_${userId}">${msg.new_chat_participant.first_name}, ➡CLICK HERE </a> to verify you are a human. Otherwise, you will be kicked from the channel.`, { parse_mode: 'HTML' }).then(res => {
    chats[msg.new_chat_member.id].clickHereMsg = res.message_id;
  })

  chats[msg.new_chat_member.id].countAttemps = 5;
  chats[msg.new_chat_member.id].chatId = chatId;
  bot.restrictChatMember(chatId, userId, { can_send_messages: false })

  setTimeout(() => {
    if (chats[msg.new_chat_member.id]?.clickHereMsg) {
      bot.deleteMessage(chatId, chats[msg.new_chat_member.id].clickHereMsg);
    }
  }, 300000);

  setTimeout(() => {
    if (chats[msg.new_chat_member.id]) {
      bot.kickChatMember(chatId, msg.new_chat_participant.id);
      bot.unbanChatMember(chatId, msg.new_chat_participant.id);
    }
  }, 900000);

  return;
});

bot.on('left_chat_member', (msg) => {
  const chatId = msg.chat.id;
  const msgId = msg.message_id;
  bot.deleteMessage(chatId, msgId);
  bot.deleteMessage(chatId, chats[msg.left_chat_member.id].clickHereMsg);
})

function generateKeyboard(captchValue) {
  let characters = 'abcdefghijklmnopqrstuvwxyz'.toUpperCase();
  let charactersLength = characters.length;

  function generateArray(requiredArr) {
    let result = [...new Set(requiredArr)];
    let length = 15 - result.length
    for (let i = 0; i < length; i++) {
      let randLetter = characters.charAt(Math.floor(Math.random() *
        charactersLength));
      if (result.includes(randLetter)) {
        i--;
      } else {
        result.push(randLetter);
      }

    }
    return result;
  }
  function shuffle(array) {
    array.sort(() => Math.random() - 0.5);
  }
  let res = generateArray(captchValue.split(''));

  shuffle(res);
  let result = [];
  let count = 0;
  for (let i = 0; i < 3; i++) {
    let tempArr = [];
    for (let j = 0; j < 5; j++) {

      tempArr.push({ text: res[count], callback_data: res[count] });
      count++;
    }
    result.push(tempArr);
  }
  return result;
}

bot.onText(/\/start(.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (chats[chatId]?.banned) {
    return bot.sendMessage(chatId, `You have been banned!`);
  }
  if (match[1].split("_")[1] == chatId) {
    let captcha = new Captcha(300);
    let keyboard = generateKeyboard(captcha.value);
    keyboard.push([
      {
        text: 'Delete',
        callback_data: 'Delete'
      },
      {
        text: 'Submit',
        callback_data: 'Submit'
      },
    ]);
    const path = require("path");
    const fs = require("fs");
    let w = captcha.PNGStream.pipe(fs.createWriteStream(path.join(__dirname, `${captcha.value}.png`)));
    w.on('finish', () => {
      bot.sendPhoto(chatId, `${captcha.value}.png`, {
        reply_markup: {
          inline_keyboard: keyboard
        }
      }).then(res => {
        chats[chatId].captchValue = captcha.value;
        chats[chatId].code = "";
        bot.sendMessage(chatId, "Your code: ").then(res => {
          chats[chatId].editMsgId = res.message_id;
        })
      });
    })
    setTimeout(() => {
      fs.unlink(`${captcha.value}.png`, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("File deleted");
        }
      })
    }, 1000);
  } else {

  }
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === "/start") {
    bot.sendMessage(chatId, "Welcome to the @AxelarCoreBot! This bot was created for Quantum Community Program. You can use it as Captcha bot for Russian Telegram channel, to do this simply add it to Russian Axelar telegram gtoup. Also you can find here some useful info and official links. Thanks for attention!", {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  } else if (text === "/sendmelinks") {
    bot.sendMessage(chatId, `<a href="https://t.me/axelarcommunity">🇬🇧English community</a>
<a href="https://t.me/axelarcommunityTR">🇹🇷French community</a>
<a href="https://t.me/axelarthai">🇹🇭Thai community</a>
<a href="https://t.me/axelar_singapore">🇸🇬Singaporean community</a>
<a href="https://t.me/axelarcommunityKR">🇰🇷Korean community</a>`, { parse_mode: 'HTML' });
  } else if(text == "/faq_docs") {
    bot.sendMessage(chatId, "Axelar Documentation: ", {
      reply_markup: {
        inline_keyboard: docsKeyboard
      }
    });
  } else if(text == "/about") {
    bot.sendMessage(chatId, "Axelar is a universal interoperability platform that connects all blockchains through a decentralized network and an SDK of protocols and APIs. Using the network and SDK, developers can efficiently create new connections and integrate their decentralized applications with all blockchain ecosystems creating greater access to users, assets, liquidity and other applications.");
  }
});


bot.on('callback_query', msg => {
  const data = msg.data;
  const chatId = msg.message.chat.id;
  if (chats[chatId]) {
    if (chats[chatId]?.banned) {
      return bot.sendMessage(chatId, `You have been banned!`);
    }
    if (data == "Delete") {
      chats[chatId].code = chats[chatId].code.slice(0, chats[chatId].code.length - 1);
    } else if (data == "Submit") {
      if (chats[chatId]?.clickHereMsg) {
        bot.deleteMessage(chats[chatId].chatId, chats[chatId].clickHereMsg);
        delete chats[chatId].clickHereMsg;
      }
      if (chats[chatId]?.code.toUpperCase() === chats[chatId]?.captchValue) {
        bot.restrictChatMember(chats[chatId].chatId, msg.from.id, { can_send_messages: true })
        delete chats[chatId];
        return bot.sendMessage(chatId, "Congratulations! You have passed the capthca. Now you are allowed to send messages in the channel!");
      } else {
        chats[chatId].countAttemps--;
        if (chats[chatId]?.countAttemps <= 0) {
          chats[chatId] = {};
          chats[chatId].banned = true;
          return bot.sendMessage(chatId, `You have been banned!`);
        }
        chats[chatId].code = "";
        return bot.sendMessage(chatId, `Wrong! Left ${chats[chatId]?.countAttemps} attemps. If you fail all of them, you will be banned!`);
      }
    } else {
      chats[chatId].code += data;
    }
    bot.answerCallbackQuery(msg.id);
    return bot.editMessageText(`Your code: ${chats[chatId].code}`, {
      chat_id: chatId,
      message_id: chats[chatId].editMsgId,
    });
  }
});





