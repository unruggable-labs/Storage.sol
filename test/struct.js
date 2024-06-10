import {ethers} from 'ethers';
import {Foundry} from '@adraffy/blocksmith';
import {readStorageArray} from './utils.js';
import {test, after} from 'node:test';
import assert from 'node:assert/strict';

test('struct', async () => {
	let foundry = await Foundry.launch({infoLog: false});
	after(() => foundry.shutdown());
	let contract = await foundry.deploy({sol: `
		import "@src/Storage.sol";
		contract Storage {
			struct S { uint256 a; uint256 b; }
			S[] array;
			S value;
			function decode(bytes memory v) external pure returns (S[] memory arr) {
				//uint256[] packing = [32, 16, 16];
				//uint256 ptr = StorageArray.decodeStructs(v, hex"2020");
				//assembly { arr := ptr }
			}
			function set(S[] memory v) external {
				delete array;
				for (uint256 i; i < v.length; i++) {
					array.push(v[i]);
				}
			}
		}
	`});

	for (let i = 0; i <= 13; i++) {
		let m0 = Array.from({length: i}, (_, i) => [BigInt(i), ethers.toBeHex(1337+10*i, 16)]);
		await foundry.confirm(contract.set(m0));
		let packed = await readStorageArray(foundry.provider, contract.target, 0, 64);
		let m1 = await contract.decode(packed).then(res => res.toArray(true));
		console.log({packed, m0, m1});
		assert.deepEqual(m0, m1, `length: ${i}`);
	}
	
});
