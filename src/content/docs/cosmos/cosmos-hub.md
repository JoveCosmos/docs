---
title: "The Cosmos Hub & ATOM"
description: "A Beginner’s Guide to the ATOM Token in the Cosmos Hub"
---

If you're familiar with **Bitcoin (BTC)** and **Ethereum (ETH)**, the **ATOM** token can feel quite different. Bitcoin is mainly a store of value, and Ethereum powers decentralized apps and smart contracts. Cosmos, however, aims to solve a unique problem—**interoperability** between blockchains. ATOM plays a crucial role in this.

**What is Cosmos Hub?**

The **Cosmos Hub** is like a central connecting point for various blockchains (called "zones") in the **Cosmos Network**. Each blockchain in Cosmos can operate independently, but the Cosmos Hub allows them to communicate and exchange assets. Think of Cosmos Hub as an airport hub, where different airlines (blockchains) can connect flights (data, assets) through the same platform. ATOM is essential to keeping this “hub” secure.

**Purpose of ATOM in the Cosmos Ecosystem**

1. **Staking and Security**: In the Cosmos Hub, **ATOM** is used for securing the network through a process called **staking**. Just as Ethereum has validators that secure its proof-of-stake (PoS) network, Cosmos also relies on validators to confirm transactions and maintain the blockchain. ATOM holders can stake (lock up) their tokens to become a validator or delegate them to an existing validator.

   **Example**: Imagine you own 100 ATOM. You can delegate them to a validator who processes transactions. In return, you’ll earn a share of the rewards that come from transaction fees and new ATOM being minted.
2. **Governance**: ATOM holders can vote on important decisions within the Cosmos network, such as software upgrades or changes to how the network operates. This makes Cosmos a decentralized and community-driven network.

   **Example**: Let’s say there’s a proposal to change the staking reward structure. If you hold ATOM, you can vote on whether the change should happen, similar to how some companies allow shareholders to vote on corporate policies.
3. **Inflationary Token**: Unlike Bitcoin, which has a fixed supply, ATOM has an **inflationary model**. This means that new ATOM tokens are created over time to incentivize people to stake and secure the network. The inflation rate varies based on how much of the total supply is staked.

   **Example**: If a lot of ATOM is staked, inflation will be lower, but if fewer tokens are staked, the inflation rate will increase to encourage more participation in securing the network.

**Why Is ATOM Different from Bitcoin and Ethereum?**

* **Bitcoin** is primarily used as digital gold—a store of value and a medium of exchange. It operates on a proof-of-work (PoW) consensus mechanism, where miners solve complex problems to validate transactions.
* **Ethereum** (after moving to proof-of-stake) powers decentralized applications (dApps) and smart contracts, where users can create complex programmable transactions. ETH is used for paying gas fees for running applications on the Ethereum network.
* **ATOM** doesn’t power smart contracts directly (like ETH), nor is it a digital store of value (like BTC). Instead, it is designed to **secure the Cosmos Hub** and **enable the connection between multiple blockchains**. Cosmos solves the issue of interoperability that Bitcoin and Ethereum don’t address natively.

If you’re already familiar with how Ethereum 2.0’s staking works or the governance features of some DeFi tokens, ATOM is similar but applied to a unique use case—interoperability between blockchains. With Cosmos and ATOM, the goal is to create an ecosystem of blockchains that can work together in a decentralized manner, rather than competing in isolation.

This makes ATOM a crucial part of a larger vision where different blockchain technologies can collaborate, enhancing innovation across the industry.<br>

**Read more here**

* [Cosmos Network](https://cosmos.network/): The official website provides comprehensive information about Cosmos, its vision, and its components.
* [Cosmos Whitepaper](https://cosmos.network/resources/whitepaper): The original whitepaper outlines the vision and technical aspects of the Cosmos network.
* [IBC Protocol Specification](https://github.com/cosmos/ibc): For a technical deep dive into how IBC works, the protocol's GitHub repository offers detailed specifications.
* [Cosmos Blog](https://blog.cosmos.network/): The official blog regularly publishes articles on various topics, including interoperability and the use of IBC.

## The Cosmos Hub in the Interchain Stack

The [Cosmos Hub](https://hub.cosmos.network/main/hub-overview/overview.html) was the first blockchain built with the Interchain Stack. It is a public Proof-of-Stake (PoS) blockchain with a native token, ATOM.

ATOM is used to secure the network and pay for transaction fees, but is also the token that has funded the development of the Interchain Stack and other projects in the wider ecosystem.

The Cosmos Hub can be understood as a router facilitating transactions between the chains connected to it. For example, the Cosmos Hub allows for transaction fees to be paid in different tokens, as long as the zone trusts the Cosmos Hub and the other zones connected to it.

*How do you connect your chain to a non-Tendermint (non-CometBFT) chain?*

The IBC connection is not limited to Tendermint-based chains. If another, non-Tendermint blockchain uses a fast-finality consensus algorithm, a connection can be established by adapting IBC to work with the non-Tendermint consensus mechanism.

If the other chain is a probabilistic-finality chain, a simple adaptation of IBC is not sufficient. A proxy chain called a peg-zone helps establish interoperability.

Peg-zones are fast-finality blockchains which track chain states to establish finality. The peg-zone chain itself is IBC-compatible and acts as a bridge between the rest of the IBC network's chains and the probabilistic-finality chain.

<details>

<summary>German/Deutsch - Der Cosmos Hub</summary>

Die erste Blockchain, die mit dem Interchain Stack aufgebaut wurde

Beim Cosmos Hub handelt es sich um eine öffentliche “Proof-of-Stake” (PoS)-Blockchain mit einem eigenen Token, ATOM.

ATOM kommt zum Einsatz, um das Netzwerk zu sichern und Transaktionsgebühren zu bezahlen, kommt ATOM zum Einsatz. Zugleich ist es aber auch der Token, der die Entwicklung des Interchain Stack und anderer Projekte im weiteren Ökosystem finanziert hat.

Der Cosmos Hub kann als Router verstanden werden, der Transaktionen zwischen den mit ihm verbundenen Chains erleichtert. So ermöglicht es der Cosmos Hub beispielsweise, dass die Transaktionsgebühren in verschiedenen Token bezahlbar sind, solange die jeweilige Zone dem Cosmos Hub und den anderen mit ihm verbundenen Zonen vertraut.

Wie lässt sich eine Blockchain mit einer anderen verbinden, die nicht auf Tendermint (CometBFT) basiert?

IBC-Verbindungen sind nicht auf Tendermint-basierte Blockchains beschränkt. Wenn eine andere, nicht Tendermint-basierte Blockchain einen Fast-Finality-Konsensalgorithmus verwendet, kann eine Verbindung hergestellt werden, indem IBC so angepasst wird, dass es mit dem Nicht-Tendermint-Konsensmechanismus funktioniert.

Handelt es sich bei der anderen Kette jedoch um eine Kette mit probabilistischer Finalität, reicht eine einfache Anpassung der IBC nicht aus. Eine Proxy-Kette, Peg-Zone genannt, hilft hier bei der Herstellung der Interoperabilität.

Peg-Zonen sind Blockchains mit schneller Endgültigkeit, die den Zustand der Kette verfolgen, um die Endgültigkeit herzustellen. Die Peg-Zone-Kette selbst ist IBC-kompatibel und fungiert als Brücke zwischen den übrigen Ketten des IBC-Netzwerks und der probabilistischen Finalitätskette.

<br>

</details>
