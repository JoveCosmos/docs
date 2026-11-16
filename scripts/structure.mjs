// The new information architecture.
//
// Two structural fixes drive most of this:
//   1. "genesis-collection-1" was titled "Genesis Collection" but is actually the
//      DAO governance section (treasury, staking, validator funding, the 14
//      constitution proposals). It was buried three levels under NFTs and shared
//      a name with the real Genesis NFT page. It gets promoted to a top-level
//      "GATA DAO" section.
//   2. The Cosmos material had two parallel introductions with duplicate pages
//      (two Cosmos Hub pages, an "Interoperability" page and an "IBC" page).
//      Those pairs are merged, and the reference material is split from the
//      step-by-step user guides.
//
// `src`   - path under _raw/
// `out`   - path under src/content/docs/
// `title` - sidebar + page title (renamed where the original was ambiguous)
// `merge` - extra source pages appended as sections, to kill duplicate pages

export const pages = [
  // ---------------------------------------------------------------- GATA HUB
  { src: "gata-hub.md", out: "gata-hub/index.md", title: "What is GATA HUB" },
  { src: "gatahub/summary.md", out: "gata-hub/at-a-glance.md", title: "At a Glance" },
  { src: "gatahub/gata-hub-faqs.md", out: "gata-hub/faq.md", title: "FAQ" },

  { src: "gatahub/gata-hub-road-map.md", out: "gata-hub/roadmap/index.md", title: "Roadmap" },
  { src: "gatahub/gata-hub-road-map/2026-roadmap.md", out: "gata-hub/roadmap/2026.md", title: "2026 Roadmap" },
  { src: "gatahub/gata-hub-road-map/2025-recap.md", out: "gata-hub/roadmap/2025.md", title: "2025 Recap" },
  { src: "gatahub/gata-hub-road-map/2024-recap.md", out: "gata-hub/roadmap/2024.md", title: "2024 Recap" },
  { src: "gatahub/gata-hub-road-map/2023-recap.md", out: "gata-hub/roadmap/2023.md", title: "2023 Recap" },
  { src: "gatahub/gata-hub-road-map/2022-recap.md", out: "gata-hub/roadmap/2022.md", title: "2022 Recap" },

  // ---------------------------------------------------------- Infrastructure
  { src: "gatahub/gata-validators.md", out: "infrastructure/validators/index.md", title: "Validators" },
  { src: "gatahub/gata-validators/slash-protection-policy.md", out: "infrastructure/validators/slash-protection.md", title: "Slash Protection Policy" },
  { src: "gatahub/gata-validators/gata-testnet-validators.md", out: "infrastructure/validators/testnet.md", title: "Testnet Validators" },
  { src: "gatahub/gata-validators/foundation-delegations.md", out: "infrastructure/validators/foundation-delegations.md", title: "Foundation Delegations" },

  { src: "gatahub/public-goods.md", out: "infrastructure/public-goods/index.md", title: "Public Goods" },
  { src: "gatahub/public-goods/gata-relays.md", out: "infrastructure/public-goods/relays.md", title: "IBC Relays" },

  // ------------------------------------------------------------ NFT collections
  {
    src: "gatahub/gata-nfts.md",
    out: "nfts/index.md",
    title: "All Collections",
    // In the collections table both cat rows pointed at the DAO page rather
    // than the NFT page — an easy mistake to make while the two pages shared
    // the title "Genesis Collection". They now have distinct names.
    fixes: [
      ["[Colonial Cats](/dao/)", "[Colonial Cats](/nfts/genesis-cats/#colonial-cats-gatac)"],
      ["[Voyager Cats](/dao/)", "[Voyager Cats](/nfts/genesis-cats/#voyager-cats-gatav)"],
    ],
  },

  { src: "gatahub/gata-nfts/genesis-collection.md", out: "nfts/genesis-cats/index.md", title: "Genesis Cats" },
  { src: "gatahub/gata-nfts/genesis-collection/dao-revenue-distribution.md", out: "nfts/genesis-cats/reward-distribution.md", title: "Reward Distribution" },
  { src: "gatahub/gata-nfts/genesis-collection/dao-revenue-distribution/dao-revenue-share-model.md", out: "nfts/genesis-cats/revenue-share-model.md", title: "Revenue Share Model" },

  { src: "gatahub/gata-nfts/yield-gorilla.md", out: "nfts/yield-gorilla/index.md", title: "Yield Gorilla" },
  { src: "gatahub/gata-nfts/yield-gorilla/yg-and-yield-concept.md", out: "nfts/yield-gorilla/yield-concept.md", title: "The Yield Concept" },
  { src: "gatahub/gata-nfts/yield-gorilla/yg-asset-allocation.md", out: "nfts/yield-gorilla/asset-allocation.md", title: "Asset Allocation" },
  { src: "gatahub/gata-nfts/yield-gorilla/yg-reward-distributions.md", out: "nfts/yield-gorilla/reward-distribution.md", title: "Reward Distribution" },

  { src: "gatahub/gata-nfts/yield-paws.md", out: "nfts/yield-paws/index.md", title: "Yield Paws" },
  { src: "gatahub/gata-nfts/yield-paws/yp-reward-distribution.md", out: "nfts/yield-paws/reward-distribution.md", title: "Reward Distribution" },

  { src: "gatahub/gata-nfts/yield-crocs.md", out: "nfts/yield-crocs/index.md", title: "Yield Crocs" },
  { src: "gatahub/gata-nfts/yield-crocs/ycs-assets.md", out: "nfts/yield-crocs/assets.md", title: "Assets" },
  { src: "gatahub/gata-nfts/yield-crocs/yc-reward-distribution.md", out: "nfts/yield-crocs/reward-distribution.md", title: "Reward Distribution" },

  { src: "gatahub/gata-nfts/pengones.md", out: "nfts/pengones.md", title: "PengOnes" },
  { src: "gatahub/gata-nfts/yield-walkers.md", out: "nfts/yield-walkers.md", title: "Yield Walkers" },
  { src: "gatahub/gata-nfts/gata-pixel.md", out: "nfts/gata-pixel.md", title: "GATA Pixel" },
  { src: "gatahub/gata-nfts/nft-souvenirs.md", out: "nfts/souvenirs.md", title: "NFT Souvenirs" },

  // --------------------------------------------------- GATA DAO (promoted)
  { src: "gatahub/gata-nfts/genesis-collection-1.md", out: "dao/index.md", title: "GATA DAO" },
  { src: "gatahub/gata-nfts/genesis-collection-1/on-chain-gata-dao.md", out: "dao/on-chain-dao.md", title: "On-Chain DAO" },
  { src: "gatahub/gata-nfts/genesis-collection-1/gata-dao-treasury.md", out: "dao/treasury.md", title: "Treasury" },
  { src: "gatahub/gata-nfts/genesis-collection-1/gata-dao-staking-delegations.md", out: "dao/staking.md", title: "Staking & Delegations" },
  { src: "gatahub/gata-nfts/genesis-collection-1/validator-funding.md", out: "dao/validator-funding.md", title: "Validator Funding" },
  { src: "gatahub/gata-nfts/genesis-collection-1/faqs.md", out: "dao/faq.md", title: "DAO FAQ" },
  { src: "gatahub/gata-nfts/genesis-collection-1/gata-constitution.md", out: "dao/constitution/index.md", title: "Constitution" },
  ...Array.from({ length: 14 }, (_, i) => {
    const n = i + 1;
    return {
      src: `gatahub/gata-nfts/genesis-collection-1/gata-constitution/gov.-proposal-${n}.md`,
      out: `dao/constitution/proposal-${String(n).padStart(2, "0")}.md`,
      title: `Proposal ${n}`,
    };
  }),

  // -------------------------------------------------------------- Yield DAO
  { src: "gatahub/gata-yield-dao.md", out: "yield-dao/index.md", title: "GATA Yield DAO" },
  { src: "gatahub/gata-yield-dao/about.md", out: "yield-dao/about.md", title: "About" },
  { src: "gatahub/gata-yield-dao/tokenomics.md", out: "yield-dao/tokenomics.md", title: "Tokenomics" },
  { src: "gatahub/gata-yield-dao/revenue-distribution.md", out: "yield-dao/revenue-distribution.md", title: "Revenue Distribution" },

  // ------------------------------------------------------------- Reward App
  { src: "gatahub/reward-app.md", out: "reward-app/index.md", title: "Reward App" },
  { src: "gatahub/reward-app/user-guide.md", out: "reward-app/user-guide.md", title: "User Guide" },
  { src: "gatahub/reward-app/caution.md", out: "reward-app/caution.md", title: "Caution" },
  { src: "gatahub/reward-app/faq.md", out: "reward-app/faq.md", title: "FAQ" },

  // ------------------------------------------- Cosmos ecosystem (reference)
  { src: "cosmos-ecosystem/introduction-to-cosmos.md", out: "cosmos/index.md", title: "Introduction to Cosmos" },
  { src: "cosmos-ecosystem/introduction-to-cosmos/ibc-zones.md", out: "cosmos/ibc-zones.md", title: "IBC Zones" },
  {
    src: "cosmos-ecosystem/introduction-to-cosmos/ibc-zones/cosmos-hub.md",
    out: "cosmos/cosmos-hub.md",
    title: "The Cosmos Hub & ATOM",
    // duplicate page: "The Cosmos Hub" under the Interchain section covered the
    // same ground from the Interchain Stack angle
    merge: [{ src: "cosmos-ecosystem/what-is-the-interchain/the-cosmos-hub.md", heading: "The Cosmos Hub in the Interchain Stack" }],
  },
  { src: "cosmos-ecosystem/introduction-to-cosmos/ibc-zones/atomone.md", out: "cosmos/atomone/index.md", title: "AtomOne" },
  { src: "cosmos-ecosystem/introduction-to-cosmos/ibc-zones/atomone/photon.md", out: "cosmos/atomone/photon.md", title: "Photon" },
  {
    src: "cosmos-ecosystem/introduction-to-cosmos/interoperability.md",
    out: "cosmos/interoperability.md",
    title: "Interoperability & IBC",
    // duplicate page: "IBC" under the Interchain section
    merge: [{ src: "cosmos-ecosystem/what-is-the-interchain/ibc.md", heading: "The IBC Protocol in Depth" }],
  },

  { src: "cosmos-ecosystem/what-is-the-interchain.md", out: "cosmos/interchain/index.md", title: "What is the Interchain?" },
  { src: "cosmos-ecosystem/what-is-the-interchain/a-whole-universe.md", out: "cosmos/interchain/a-whole-universe.md", title: "A Whole Universe" },
  { src: "cosmos-ecosystem/what-is-the-interchain/the-cosmos-sdk.md", out: "cosmos/interchain/cosmos-sdk.md", title: "The Cosmos SDK" },
  { src: "cosmos-ecosystem/what-is-the-interchain/ignite-cli.md", out: "cosmos/interchain/ignite-cli.md", title: "Ignite CLI" },
  { src: "cosmos-ecosystem/what-is-the-interchain/cosmwasm.md", out: "cosmos/interchain/cosmwasm.md", title: "CosmWasm" },
  { src: "cosmos-ecosystem/what-is-the-interchain/frameworks-and-sdks.md", out: "cosmos/interchain/frameworks-and-sdks.md", title: "Frameworks & SDKs" },

  { src: "cosmos-ecosystem/ics.md", out: "cosmos/interchain-security/index.md", title: "Interchain Security" },
  { src: "cosmos-ecosystem/ics/atom-economic-zone-aez.md", out: "cosmos/interchain-security/atom-economic-zone.md", title: "Atom Economic Zone" },
  { src: "cosmos-ecosystem/ics/atom-economic-zone-aez/stride.md", out: "cosmos/interchain-security/stride.md", title: "Stride" },
  { src: "cosmos-ecosystem/ics/atom-economic-zone-aez/neutron.md", out: "cosmos/interchain-security/neutron.md", title: "Neutron" },
  { src: "cosmos-ecosystem/ics/ics-2.0-pss-partial-set-security.md", out: "cosmos/interchain-security/partial-set-security.md", title: "Partial Set Security" },
  { src: "cosmos-ecosystem/ics/ics-2.0-pss-partial-set-security/elys-network.md", out: "cosmos/interchain-security/elys-network.md", title: "Elys Network" },

  // -------------------------------------------------- Guides (how-to-cosmos)
  { src: "cosmos-ecosystem/how-to-cosmos.md", out: "guides/index.md", title: "How to Cosmos" },
  { src: "cosmos-ecosystem/how-to-cosmos/creating-and-securing-your-cosmos-wallet.md", out: "guides/wallets/index.md", title: "Wallets" },
  { src: "cosmos-ecosystem/how-to-cosmos/creating-and-securing-your-cosmos-wallet/keplr-wallet.md", out: "guides/wallets/keplr.md", title: "Keplr Wallet" },
  { src: "cosmos-ecosystem/how-to-cosmos/creating-and-securing-your-cosmos-wallet/leap-wallet.md", out: "guides/wallets/leap.md", title: "Leap Wallet" },
  { src: "cosmos-ecosystem/how-to-cosmos/creating-and-securing-your-cosmos-wallet/metamask-snap.md", out: "guides/wallets/metamask-snap.md", title: "MetaMask Snap" },
  { src: "cosmos-ecosystem/how-to-cosmos/creating-and-securing-your-cosmos-wallet/securing-your-wallet.md", out: "guides/wallets/securing-your-wallet.md", title: "Securing Your Wallet" },
  { src: "cosmos-ecosystem/how-to-cosmos/creating-and-securing-your-cosmos-wallet/staking-your-assets-via-keplr-wallet.md", out: "guides/wallets/staking-with-keplr.md", title: "Staking with Keplr" },

  { src: "cosmos-ecosystem/how-to-cosmos/ibc-inter-blockchain-communication.md", out: "guides/ibc/index.md", title: "Using IBC" },
  { src: "cosmos-ecosystem/how-to-cosmos/ibc-inter-blockchain-communication/step-by-step-guide-to-ibc.md", out: "guides/ibc/step-by-step.md", title: "Step-by-Step IBC Transfer" },

  { src: "cosmos-ecosystem/how-to-cosmos/participation-in-cosmos-governance.md", out: "guides/governance/index.md", title: "Participating in Governance" },
  { src: "cosmos-ecosystem/how-to-cosmos/participation-in-cosmos-governance/cosmos-governance.md", out: "guides/governance/how-it-works.md", title: "How Governance Works" },
  { src: "cosmos-ecosystem/how-to-cosmos/participation-in-cosmos-governance/choosing-a-validator.md", out: "guides/governance/choosing-a-validator.md", title: "Choosing a Validator" },

  // ------------------------------------------------------------- Community
  { src: "whats-cooking-in-community/zealy-formerly-crew3.md", out: "community/zealy.md", title: "Zealy" },
  { src: "whats-cooking-in-community/disclaimer.md", out: "community/disclaimer.md", title: "Disclaimer" },
];

// Sidebar groups, in order. Each entry is a directory under src/content/docs/.
export const sidebar = [
  { label: "GATA HUB", dir: "gata-hub" },
  { label: "Infrastructure", dir: "infrastructure" },
  { label: "NFT Collections", dir: "nfts" },
  { label: "GATA DAO", dir: "dao" },
  { label: "GATA Yield DAO", dir: "yield-dao" },
  { label: "Reward App", dir: "reward-app" },
  { label: "Cosmos Ecosystem", dir: "cosmos" },
  { label: "Guides", dir: "guides" },
  { label: "Community", dir: "community" },
];
