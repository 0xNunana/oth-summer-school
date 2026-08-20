# Voting Contract — Demo Guide

`Voting.sol` fulfills the course requirements: voting on topics defined by the
constructor, everybody votes exactly once, results can be read, only the owner
can manage a blacklist of accounts that are not allowed to vote.

`Voting.bin` (bytecode) and `Voting.abi.json` were compiled with solc 0.8.36
(optimizer on, EVM version `paris`). To recompile yourself, paste `Voting.sol`
into [Remix](https://remix.ethereum.org), pick a 0.8.x compiler, compile, and
copy the bytecode — or use the `solc` npm package.

## 1. Setup

```bash
npm install
cp .env.example .env   # fill in your Testnet account from portal.hedera.com
```

## 2. Deploy (topics go in as constructor arguments)

```bash
node deploy.js ./Voting.bin --gas 800000 --arg-string "Pizza" --arg-string "Pasta" --arg-string "Salad"
```

Note the printed `Contract ID` (0.0.xxxxx) and put it into `call.js`.

## 3. Call functions (edit the CONFIG block in call.js, then `node call.js`)

| Function              | MODE      | METHOD_NAME      | RETURN_TYPE | buildParams()                  |
|-----------------------|-----------|------------------|-------------|--------------------------------|
| vote(topicIndex)      | "execute" | "vote"           | null        | params.addUint256(0)           |
| addToBlacklist(addr)  | "execute" | "addToBlacklist" | null        | params.addAddress("0x...")     |
| getTopicCount()       | "query"   | "getTopicCount"  | "uint256"   | (none)                         |
| getTopic(topicIndex)  | "query"   | "getTopic"       | "string"    | params.addUint256(0)           |
| getVotes(topicIndex)  | "query"   | "getVotes"       | "uint256"   | params.addUint256(0)           |

## 4. Multi-account demo script

The account in `.env` is the caller (`msg.sender`). To demo with multiple
accounts, swap the credentials in `.env` between calls (use a second Testnet
account, or a classmate's — anyone can call your contract by its ID).

1. **Account A (owner/deployer)**: `vote(0)` → status SUCCESS.
2. **Account A again**: `vote(1)` → fails with CONTRACT_REVERT_EXECUTED
   ("You have already voted").
3. **Account A**: `addToBlacklist(<EVM address of account B>)` → SUCCESS.
   Find B's EVM address on `https://hashscan.io/testnet/account/0.0.xxxxx`
   (use the "EVM Address" shown there — that is what `msg.sender` will be).
4. **Account B** (swap `.env`): `vote(0)` → fails ("You are blacklisted").
5. **Account C / classmate**: `vote(0)` → SUCCESS.
6. **Anyone**: `getVotes(0)`, `getVotes(1)`, `getVotes(2)` → print the result
   per topic (topic names via `getTopic(i)`, count via `getTopicCount()`).

Failed `execute` calls end with status `CONTRACT_REVERT_EXECUTED` — that is the
require() in the contract doing its job; the vote count is unchanged.
