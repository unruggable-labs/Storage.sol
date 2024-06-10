import {ethers} from 'ethers';
import {Foundry} from '@adraffy/blocksmith';
import {readStorageArray} from './utils.js';
import {test, after} from 'node:test';
import assert from 'node:assert/strict';

for (let size = 1; size <= 32; size++) {
	const type = `bytes${size}[]`;
	test(type, async T => {
		let foundry = await Foundry.launch({infoLog: false});
		after(() => foundry.shutdown());
		let contract = await foundry.deploy({sol: `
			import "@src/StorageCoder.sol";
			contract Storage {
				${type} array;
				function decode(bytes memory v) external pure returns (${type} memory arr) {
					uint256 ptr = StorageCoder.decodeValueArray(v, ${size}, true);
					assembly { arr := ptr }
				}
				function set(${type} memory v) external {
					array = v;
				}
			}
		`});
		for (let n = 0; n <= 33; n++) {
			//await T.test(`length: ${n}`, async () => {
				let v0 = Array.from({length: n}, (_, i) => ethers.toBeHex(i, size));
				await foundry.confirm(contract.set(v0));			
				let packed = await readStorageArray(foundry.provider, contract.target, 0, size);
				let v1 = [...await contract.decode(packed)];
				assert.deepEqual(v0, v1, `length: ${n}`);
			//});
		}
	});
}
