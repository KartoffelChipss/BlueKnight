# BlueKnight Launcher

Blueknight is a Minecraft Launcher made with electron, that uses the Modrinth api to make installing mods as easy as possible.

![BlueKnight Launcher Screenshot](https://file.strassburger.dev/blueknight_screenshot.png)

Please keep in mind, that this launcher is still in development and not very stable!

---

## Installation

### Easy way:

Go to the [Releases](https://github.com/KartoffelChipss/blueknight/releases), download the latest installer for your OS and install it.

### Little bit harder way:

You need to have Node.js, npm and git installed.

Clone this repository:
```
git clone https://github.com/KartoffelChipss/blueknight
```
Move to the apps directory, install all dependencies and start the app:
```
cd blueknight
npm install
npm run start
```
If you want to build an installer yourself use one of the following commands:
- Windows: `npm run dist:win`
- MacOS: `npm run dist:mac`
- Linux: `npm run dist:linux`