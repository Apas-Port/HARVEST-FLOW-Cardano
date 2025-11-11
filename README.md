# HARVEST FLOW - Cardano NFT Minting Platform

> Engage in Social Action with a Steady Fixed Interest. Connecting with the world through cryptocurrency lending.

HARVEST FLOW is a decentralized platform built on Cardano blockchain that enables users to mint NFTs representing Proof of Support for real-world asset (RWA) lending projects. The platform focuses on microfinance initiatives, particularly supporting tuktuk drivers in Southeast Asia through crypto-backed loans.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Development](#development)
- [Smart Contracts](#smart-contracts)
- [Deployment](#deployment)
- [Directory Structure](#directory-structure)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

HARVEST FLOW combines blockchain technology with social impact by:

- **NFT Minting**: Users can mint NFTs that represent their support for lending projects
- **RWA Lending**: Facilitates crypto-backed loans for real-world assets (tuktuks in Southeast Asia)
- **Transparent Returns**: Fixed interest rates with blockchain-verified transactions
- **Multi-language Support**: Available in English and Japanese
- **Wallet Integration**: Seamless connection with Cardano wallets (Nami, Eternl, Lace, etc.)

## ✨ Features

- 🎨 **NFT Minting**: Mint unique Proof of Support NFTs on Cardano blockchain
- 📊 **Project Dashboard**: Real-time project statistics, minted count, and funding progress
- 🔐 **Wallet Integration**: Connect with popular Cardano wallets via Mesh SDK
- 🌐 **Internationalization**: Full i18n support for English and Japanese
- 📱 **Responsive Design**: Modern UI built with TailwindCSS, optimized for all devices
- 🔄 **Real-time Updates**: Live blockchain data via Blockfrost and Koios APIs
- 🎯 **Smart Contract Integration**: Aiken-based Plutus validators for secure on-chain operations
- 📈 **RWA Data Visualization**: Charts and analytics for project performance

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14.2.13 (App Router)
- **Language**: TypeScript 5.9.2
- **Styling**: TailwindCSS 4.1.3
- **State Management**: React Query (@tanstack/react-query)
- **UI Components**: Custom components with Radix UI patterns
- **Animations**: Motion (Framer Motion)

### Blockchain
- **Cardano SDK**: Lucid Cardano 0.10.11
- **Wallet Integration**: Mesh SDK 1.9.0-beta
- **Blockchain API**: Blockfrost API
- **Smart Contracts**: Aiken (Plutus validators)
- **Transaction Building**: Custom transaction builders with CSL

### Infrastructure
- **Deployment**: Vercel
- **Database**: Vercel Postgres (optional)
- **Image Storage**: IPFS (via ipfs.io)
- **Package Manager**: pnpm

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Frontend                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   App Router │  │  Components  │  │    Hooks     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Cardano Blockchain Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Mesh SDK     │  │ Lucid        │  │ Aiken        │  │
│  │ (Wallets)    │  │ (Transactions)│  │ (Contracts)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Cardano Network (Mainnet/Preprod)           │
└─────────────────────────────────────────────────────────┘
```

## 📦 Installation

### Prerequisites

- **Node.js**: >= 18.0.0 (20.x recommended)
- **pnpm**: Latest version
- **Cardano Wallet**: Nami, Eternl, Lace, or other compatible wallet
- **Blockfrost API Key**: Sign up at [blockfrost.io](https://blockfrost.io)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd HARVEST-FLOW-Cardano
```

### Step 2: Install Dependencies

```bash
# Install frontend dependencies
pnpm install

# Install CLI dependencies (for project management)
cd scripts
pnpm install
cd ..
```

### Step 3: Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Network Configuration
CARDANO_NETWORK=preprod  # or 'mainnet' for production

# Blockfrost API Configuration
BLOCKFROST_API_KEY=your_preprod_api_key
BLOCKFROST_MAINNET_API_KEY=your_mainnet_api_key  # Optional
BLOCKFROST_PROJECT_ID=your_project_id

# Treasury Address (receives payments)
NEXT_PUBLIC_PROJECT_TREASURY_ADDRESS=addr_test1q...

# Policy ID (generated after contract deployment)
HARVESTFLOW_POLICY_ID=your_policy_id

# Payment Wallet (for server-side operations)
PAYMENT_MNEMONIC="your 24-word mnemonic phrase"
PAYMENT_ACCOUNT_INDEX=0
PAYMENT_ADDRESS_INDEX=0

# Project Configuration
COLLECTION_NAME=Harvestflow
FEE_PRICE_LOVELACE=1969750
EXPECTED_APR_NUMERATOR=1
EXPECTED_APR_DENOMINATOR=10
MATURATION_TIME=2338311809
MAX_MINTS=100

# Optional: Google Sheets API (for asset data)
GAS_ENDPOINT=https://script.google.com/macros/s/your-script-id/exec

# Optional: Database (Vercel Postgres)
POSTGRES_URL=your_postgres_url
POSTGRES_URL_NON_POOLING=your_postgres_url_non_pooling

# Optional: NFT API Secret
NFT_API_SECRET=your_secret_key
```

### Step 4: Build and Run

```bash
# Development mode
pnpm dev

# Production build
pnpm build
pnpm start

# Lint code
pnpm lint
```

The application will be available at `http://localhost:3000`.

## ⚙️ Configuration

### Network Configuration

The application automatically detects the network based on `CARDANO_NETWORK`:

- **Preprod (Testnet)**: `CARDANO_NETWORK=preprod`
- **Mainnet**: `CARDANO_NETWORK=mainnet`

Network-specific settings are managed in `lib/network-config.ts`.

### Project Configuration

Projects are defined in JSON files:
- **Development**: `public/data/dev-projects.json`
- **Production**: `public/data/projects.json`

Example project structure:

```json
{
  "id": "00000000000000000000000000000001",
  "num": 1,
  "title": "Project Name",
  "subTitle": "Subtitle",
  "description": "Project description",
  "apy": 8.0,
  "lendingType": "ADA",
  "network": "Cardano",
  "capacity": 300,
  "unitPrice": 1,
  "collectionName": "Harvestflow",
  "policyId": "your_policy_id",
  "status": "active",
  "listing": true,
  "maxMints": 100,
  "mintPriceLovelace": 1969750
}
```

## 🚀 Usage

### Minting NFTs

1. **Connect Wallet**: Click "Connect Wallet" and select your Cardano wallet
2. **Select Project**: Browse available projects on the homepage
3. **Mint NFT**: Click "Mint" and confirm the transaction in your wallet
4. **View NFT**: Check your portfolio in the "My Account" section

### CLI Commands

The project includes a CLI tool for managing projects and contracts:

```bash
# Navigate to scripts directory
cd scripts

# Check wallet balance
pnpm run hf -- balance --network=preprod

# Initialize a new project protocol
pnpm run hf -- init --project-id=00000000000000000000000000000001 --network=preprod

# Check oracle state
pnpm run hf -- o --project-id=00000000000000000000000000000001 --network=preprod

# Enable/Disable minting
pnpm run hf -- em --project-id=00000000000000000000000000000001 --network=preprod
pnpm run hf -- dm --project-id=00000000000000000000000000000001 --network=preprod

# List NFT holders
pnpm run hf -- lh --project-id=00000000000000000000000000000001 --network=preprod
```

For detailed CLI usage, see [docs/新しいプロジェクトの追加方法.md](docs/新しいプロジェクトの追加方法.md).

## 💻 Development

### Project Structure

```
HARVEST-FLOW-Cardano/
├── app/                    # Next.js App Router
│   ├── [lng]/             # Internationalized routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/             # React components
│   ├── account/           # Account/portfolio components
│   ├── common/            # Shared components
│   ├── modal/             # Modal dialogs
│   ├── proof/             # Proof of Support components
│   └── providers/         # Context providers
├── cardano_contract/       # Aiken smart contracts
│   ├── validators/        # Plutus validators
│   └── lib/               # Contract libraries
├── lib/                    # Utility functions
│   ├── cardano-*.ts       # Cardano-specific utilities
│   ├── network-config.ts  # Network configuration
│   └── project.ts         # Project data management
├── hooks/                  # Custom React hooks
├── public/                 # Static assets
│   ├── data/              # Project JSON files
│   ├── images/            # Image assets
│   └── locales/           # i18n translation files
└── scripts/                # CLI tools and scripts
```

### Available Scripts

```bash
# Development
pnpm dev              # Start development server

# Production
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint

# Smart Contracts (in cardano_contract/)
cd cardano_contract
aiken build           # Build Aiken contracts
aiken check           # Run contract tests
aiken docs            # Generate documentation
```

### Adding a New Project

See [docs/新しいプロジェクトの追加方法.md](docs/新しいプロジェクトの追加方法.md) for detailed instructions.

Quick steps:
1. Add project entry to `public/data/dev-projects.json`
2. Run `pnpm run hf -- init --project-id=<id> --network=preprod`
3. Update environment variables with generated `PARAM_UTXO_*`
4. Test minting and verify policy ID
5. Deploy to mainnet when ready

## 🔐 Smart Contracts

The project uses **Aiken** for writing Plutus validators. Contracts are located in `cardano_contract/validators/`.

### Building Contracts

```bash
cd cardano_contract
aiken build
```

### Contract Structure

- **Validators**: Plutus scripts for NFT minting and protocol management
- **Oracle**: On-chain state management for project parameters
- **Policy**: NFT minting policy with time-locked parameters

For more details, see [cardano_contract/README.md](cardano_contract/README.md).

## 🚢 Deployment

### Vercel Deployment

The project is configured for Vercel deployment. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

**Quick Deploy:**

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

**Vercel Settings:**
- Framework: Next.js
- Node.js Version: 20.x
- Install Command: `pnpm install --no-frozen-lockfile`
- Build Command: `pnpm build`

### Mainnet Deployment

Before deploying to mainnet:

1. ✅ Test thoroughly on preprod
2. ✅ Update `CARDANO_NETWORK=mainnet`
3. ✅ Use mainnet Blockfrost API key
4. ✅ Verify treasury address
5. ✅ Initialize protocol on mainnet
6. ✅ Update `public/data/projects.json`

See [MAINNET_DEPLOYMENT.md](MAINNET_DEPLOYMENT.md) for complete checklist.

## 📁 Directory Structure

```
HARVEST-FLOW-Cardano/
├── app/                      # Next.js application
│   ├── [lng]/               # Internationalized pages
│   │   ├── account/         # User account page
│   │   ├── proof/           # Proof of Support page
│   │   └── page.tsx         # Homepage
│   ├── api/                 # API routes
│   │   ├── cardano/         # Cardano API endpoints
│   │   ├── fetch-gms/       # GMS data fetching
│   │   ├── fetch-rwa/       # RWA data fetching
│   │   └── nft/             # NFT endpoints
│   └── layout.tsx           # Root layout
├── cardano_contract/         # Smart contracts
│   ├── aiken/               # Aiken project
│   │   ├── validators/      # Plutus validators
│   │   └── lib/             # Contract libraries
│   └── index.ts             # Contract exports
├── components/              # React components
│   ├── account/             # Account components
│   ├── common/              # Common UI components
│   ├── modal/               # Modal dialogs
│   ├── proof/               # Proof components
│   └── providers/           # Context providers
├── config/                  # Configuration files
├── db/                      # Database schemas
├── docs/                    # Documentation
├── hooks/                   # Custom React hooks
├── i18n/                    # Internationalization
├── lib/                     # Utility libraries
├── public/                  # Static assets
│   ├── data/                # Project data JSON
│   ├── images/              # Image assets
│   └── locales/             # Translation files
├── scripts/                 # CLI and build scripts
├── types/                   # TypeScript types
└── utils/                   # Utility functions
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use TailwindCSS for styling
- Write descriptive commit messages
- Test on preprod before mainnet deployment
- Update documentation for new features

## 🔗 Resources

- [Cardano Developer Portal](https://developers.cardano.org/)
- [Blockfrost Documentation](https://docs.blockfrost.io/)
- [Mesh SDK Documentation](https://meshjs.dev/)
- [Aiken Language](https://aiken-lang.org/)
- [Lucid Cardano](https://github.com/spacebudz/lucid)
- [Next.js Documentation](https://nextjs.org/docs)

## 📞 Support

For issues and questions:
- Check existing documentation in `docs/`
- Review deployment guides: [DEPLOYMENT.md](DEPLOYMENT.md), [MAINNET_DEPLOYMENT.md](MAINNET_DEPLOYMENT.md)
- Open an issue on GitHub

---

**Built with ❤️ for social impact on Cardano blockchain**
