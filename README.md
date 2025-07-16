# Vixdex Interface 🧠📈

**Vixdex** is a decentralized volatility index platform where users can view assets, trade/swaps, track earnings, and even create derivative tokens — all through a sleek, modern, and responsive interface built with **Next.js**, **TailwindCSS**, and **Radix UI**.

> Built to make volatility tradable. Powered by on-chain data and charting tools.

---

## 🌐 Live Demo

[🔗 Click here to see the deployed app](https://your-app.vercel.app) <!-- Replace with actual link -->

---

## 🧭 Pages Overview

### 1. 🏠 Asset Page (Homepage)
- View all available assets in a dynamic table.
- Price, volatility index, and other metrics.
- Filtering & sorting support.

### 2. 🔄 Swap & Trade Page
- Trade between tokens or derivatives.
- Candlestick & line charts via **Recharts**/**Lightweight Charts**.
- View transaction history for all swaps.

### 3. 👤 Profile Page
- Displays user-specific data:
  - Total tokens bought
  - Earnings from volatility plays
  - Wallet-based performance overview

### 4. 🧪 Create Derive Page
- Create new derivative tokens based on volatility.
- Customizable parameters for asset creation.
- UI-driven flow for defining logic, duration, and naming.

---

## ✨ Features

- 🔐 Wallet auth & login using **Privy**
- 📉 Live market data via charts & tables
- 🎛 Create synthetic derivatives in a few clicks
- 💡 Elegant, accessible UI with **Radix UI**
- 🌓 Theme toggle using `next-themes`
- 🎨 Fully responsive with TailwindCSS
- 🧾 Form validation with Zod + React Hook Form
- 📊 Rich data visualization (Recharts & Lightweight Charts)

---

## 🛠 Tech Stack

| Tech           | Purpose                                  |
|----------------|------------------------------------------|
| Next.js        | React framework for SSR/SSG              |
| TailwindCSS    | Styling & responsive design              |
| Radix UI       | Headless component library               |
| Ethers.js      | Web3 & Ethereum wallet interaction       |
| Privy          | Auth + wallet connection abstraction     |
| Recharts       | Line, bar, and area charts               |
| Lightweight Charts | High-performance candlestick charts |
| Zod            | Schema validation                        |
| React Hook Form | Form state & submission                 |
| Lucide Icons   | Icon set                                 |

---

## 🛠 Installation Guide

### 🔁 Clone the Repository

```bash
git clone https://github.com/vixdex/vixdex_Interface.git
cd vixdex_Interface
npm install

Create a .env.local file

NEXT_PUBLIC_PRIVY_APP_ID="....."
NEXT_PUBLIC_PRIVY_CLIENT_ID="......"

NEXT_PUBLIC_NODE_URL="http://localhost:8000/"

NEXT_PUBLIC_VIX_CONTRACT_ADDRESS="0x6F67E70BB3402dfaAa7E0f6571B3844E24f908c8"
NEXT_PUBLIC_VIX_ROUTER_ADDRESS="0x5822A01d9465ce997e652ff592d0dB9604ef3dc1"
NEXT_PUBLIC_BASE_TOKEN_ADDRESS="0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"

NEXT_PUBLIC_NETWORK="eth"
NEXT_PUBLIC_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"

NEXT_PUBLIC_GEKO_TERMINAL_URL="https://api.geckoterminal.com/api/v2/"

npm run dev
Then open http://localhost:3000 in your browser

```


