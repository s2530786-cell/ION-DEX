ION DEX
 
ION DEX is the first full-stack Web3 DEX and ecosystem portal built on the ION Chain, compatible with the ICE Network. It is independently developed by community developer Master.
 
Core Features
 
- Token swap & professional spot trading
- Limit orders & on-chain spot grid trading strategies
- Liquidity pools & LP staking
- Analytics for official, DEX and ecosystem staking
- Dual-chain burn tracking for ION (BSC & ION Mainnet)
- Cross-chain flow monitoring between ION Chain and BSC
- ION DNS resolution, domain transfers & marketplace
- ION ID / KYC Pass integration
- AI market analysis, risk scoring & AI sentinel monitoring
- Treasury management, fee distribution, transparency & admin tools
- 5D futuristic neon UI with aurora and galaxy backgrounds
 
Current Stage
 
Blueprint & architecture development
 
Documentation
 
plaintext
  
docs/00-project-overview.md
docs/01-official-addresses-and-assumptions.md
docs/02-tokenomics-and-fees.md
docs/03-technical-architecture.md
docs/04-development-roadmap.md
docs/28-public-development-scope.md   # 对外开发范围概要（中文，无战略细节）
docs/05-product-prd.md
docs/06-page-flow-and-user-journeys.md
 
 
Repository Structure
 
plaintext
  
ion-dex-nuke/
├── ion/                # ICE Open Network upstream & node source
├── contracts/
│   ├── ion/
│   └── bsc/
├── frontend/
├── backend/
├── indexer/
├── relayer/
├── sentinel/
├── scripts/
├── infra/
├── docs/
├── audits/
└── README.md
 
 
Repository Notes
 
The  ion/  directory is excluded from this repo. Clone upstream source alongside this project:
 
bash
  
git clone https://github.com/ice-blockchain/ion ion
 
 
GitHub Actions workflow  .github/workflows/ion-dex-verify.yml  validates frontend and scripts only; no build for  ion/ .
 
Build Sequence
 
1. Finalize assumptions and official addresses
2. Build UI design system
3. Implement contract foundations
4. Develop backend core
5. Deploy indexers
6. Integrate oracle, keeper and bridge services
7. Develop frontend pages
8. Implement DNS & ION ID modules
9. Integrate AI analytics & sentinel modules
10. Complete admin, transparency, testing, audits & launch pipelines