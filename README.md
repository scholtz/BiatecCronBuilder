# Biatec Cron Builder

This is the frontend repo for the decentralized algorand scheduler.

Decentralized scheduler consists of the frontend blockly code builder where anyone can build their own logic. Person selects the start time and period how often the tasks should execute and execution fee in tokenized gold. User deposits funds to the escrow account. Anyone can execute the tasks from the escrow account when the times comes. Each execution event is logged in the escrow account transactions.

## Executor competition

Anyone can execute the tasks. Successful executor will receive reward set in the smart contract. 

When scheduling contract is deployed the pay tx is paid to SCPSTM7HIYCTAXLFFGSOKQRW24RKSPIEWSYSG52PKR2LESGRYTUGNBS7S4 with note "reg". Each executor can track new scheduling tasks by tracking transactions of this account.

## XGov grant

This work has been performed with support from the Algorand Foundation xGov Grants Program - [xGov#90](https://github.com/algorandfoundation/xGov/blob/main/Proposals/xgov-90.md).

- Source code of the frontend smart contract blockly builder - https://github.com/scholtz/BiatecCronBuilder
- Source code of the backend yaml 2 tealscript builder - https://github.com/scholtz/BiatecCron
