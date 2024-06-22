/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class AssetTransfer extends Contract {

    async InitLedger(ctx) {
        // const assets = [
        //     {
        //         ID: 'voto1',
        //         Color: 'azul',
        //         Size: 5,
        //         Owner: 'Tomoko',
        //         AppraisedValue: 300,
        //     },
        //     {
        //         ID: 'voto2',
        //         Color: 'vermelho',
        //         Size: 5,
        //         Owner: 'Brad',
        //         AppraisedValue: 400,
        //     },
        //     {
        //         ID: 'voto3',
        //         Color: 'verde',
        //         Size: 10,
        //         Owner: 'Jin Soo',
        //         AppraisedValue: 500,
        //     },
        //     {
        //         ID: 'voto4',
        //         Color: 'amarelo',
        //         Size: 10,
        //         Owner: 'Max',
        //         AppraisedValue: 600,
        //     },
        //     {
        //         ID: 'voto5',
        //         Color: 'preto',
        //         Size: 15,
        //         Owner: 'Adriana',
        //         AppraisedValue: 700,
        //     },
        //     {
        //         ID: 'voto6',
        //         Color: 'branco',
        //         Size: 15,
        //         Owner: 'Michel',
        //         AppraisedValue: 800,
        //     },
        // ];

        const candidates = [
            {
                ID: 'candidate1',
                Name: 'Alice',
                Party: 'Partido A',
                Votes: 0,
            },
            {
                ID: 'candidate2',
                Name: 'Bob',
                Party: 'Partido B',
                Votes: 0,
            }
        ];

        const voters = [
            {
                ID: 'voter1',
                Name: 'John Doe',
                Registered: true,
            },
            {
                ID: 'voter2',
                Name: 'Jane Smith',
                Registered: true,
            }
        ];

        const votes = [
            {
                ID: 'vote1',
                VoterID: 'voter1',
                CandidateID: 'candidate1',
            },
            {
                ID: 'vote2',
                VoterID: 'voter2',
                CandidateID: 'candidate2',
            }
        ];

        // for (const asset of assets) {
        //     asset.docType = 'asset';
        //     // example of how to write to world state deterministically
        //     // use convetion of alphabetic order
        //     // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        //     // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
        //     await ctx.stub.putState(asset.ID, Buffer.from(stringify(sortKeysRecursive(asset))));
        // }

        for (const candidate of candidates) {
            candidate.docType = 'candidate';
            await ctx.stub.putState(candidate.ID, Buffer.from(stringify(sortKeysRecursive(candidate))));
        }

        for (const voter of voters) {
            voter.docType = 'voter';
            await ctx.stub.putState(voter.ID, Buffer.from(stringify(sortKeysRecursive(voter))));
        }

        for (const vote of votes) {
            vote.docType = 'vote';
            await ctx.stub.putState(vote.ID, Buffer.from(stringify(sortKeysRecursive(vote))));
        }

    }

    // // CreateAsset issues a new asset to the world state with given details.
    // async CreateAsset(ctx, id, color, size, owner, appraisedValue) {
    //     const exists = await this.AssetExists(ctx, id);
    //     if (exists) {
    //         throw new Error(`The asset ${id} already exists`);
    //     }

    //     const asset = {
    //         ID: id,
    //         Color: color,
    //         Size: size,
    //         Owner: owner,
    //         AppraisedValue: appraisedValue,
    //     };
    //     // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
    //     await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
    //     return JSON.stringify(asset);
    // }

    // Método para criar um novo candidato
    async CreateCandidate(ctx, id, name, party) {
        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`The candidate ${id} already exists`);
        }

        const candidate = {
            ID: id,
            Name: name,
            Party: party,
            Votes: 0,
        };
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(candidate))));
        return JSON.stringify(candidate);
    }

    // Método para registrar um novo eleitor
    async RegisterVoter(ctx, id, name) {
        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`The voter ${id} already exists`);
        }

        const voter = {
            ID: id,
            Name: name,
            Registered: true,
        };
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(voter))));
        return JSON.stringify(voter);
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async ReadAsset(ctx, id) {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    // Método para lançar um voto
    async CastVote(ctx, id, voterID, candidateID) {
        const voteExists = await this.AssetExists(ctx, id);
        if (voteExists) {
            throw new Error(`The vote ${id} already exists`);
        }

        const voter = await this.ReadAsset(ctx, voterID);
        if (!voter || !voter.Registered) {
            throw new Error(`The voter ${voterID} is not registered`);
        }

        const candidate = await this.ReadAsset(ctx, candidateID);
        if (!candidate) {
            throw new Error(`The candidate ${candidateID} does not exist`);
        }

        const vote = {
            ID: id,
            VoterID: voterID,
            CandidateID: candidateID,
        };

        candidate.Votes += 1;
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(vote))));
        await ctx.stub.putState(candidate.ID, Buffer.from(stringify(sortKeysRecursive(candidate))));
        return JSON.stringify(vote);
    }

    // // UpdateAsset updates an existing asset in the world state with provided parameters.
    // async UpdateAsset(ctx, id, color, size, owner, appraisedValue) {
    //     const exists = await this.AssetExists(ctx, id);
    //     if (!exists) {
    //         throw new Error(`The asset ${id} does not exist`);
    //     }

    //     // overwriting original asset with new asset
    //     const updatedAsset = {
    //         ID: id,
    //         Color: color,
    //         Size: size,
    //         Owner: owner,
    //         AppraisedValue: appraisedValue,
    //     };
    //     // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
    //     return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
    // }

    // // DeleteAsset deletes an given asset from the world state.
    // async DeleteAsset(ctx, id) {
    //     const exists = await this.AssetExists(ctx, id);
    //     if (!exists) {
    //         throw new Error(`The asset ${id} does not exist`);
    //     }
    //     return ctx.stub.deleteState(id);
    // }

    // AssetExists returns true when asset with given ID exists in world state.
    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // TransferAsset updates the owner field of asset with given id in the world state.
    async TransferAsset(ctx, id, newOwner) {
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        const oldOwner = asset.Owner;
        asset.Owner = newOwner;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return oldOwner;
    }

    // GetAllAssets returns all assets found in the world state.
    async GetAllAssets(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            console.log(strValue);
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    async CreateVote(ctx, id, voterId, candidateId) {

        console.log(id, voterId, candidateId);

        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`O voto ${id} já existe`);
        }

        const voter = await this.ReadAsset(ctx, voterId);
        if (!voter) {
            throw new Error(`The voter ${voterId} is not registered`);
        }

        const candidate = await this.ReadAsset(ctx, candidateId);
        if (!candidate) {
            throw new Error(`The candidate ${candidateId} does not exist`);
        }


        const vote = {
            ID: id,
            VoterID: voterId,
            CandidateID: candidateId,
            docType: 'vote',
        };

        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(vote))));
        return JSON.stringify(vote);
    }
}

module.exports = AssetTransfer;
