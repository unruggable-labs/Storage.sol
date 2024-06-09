import {ethers} from 'ethers';
import {Foundry} from '@adraffy/blocksmith';

let foundry = await Foundry.launch();

const TYPES = [
	{type: 'uint48',  size: 6,  value: [123, 2, 3, 4, 5, 6, 7]}, 
	{type: 'uint112', size: 14, value: [1, 2, 3, 4, 5, 6, 7]},
];

let storage = await foundry.deploy({sol: `
	import "@src/StorageArray.sol";
	contract Storage {
		${TYPES.map(({type, size, value}, i) => `
			${type}[] slot${i} = [${value}];
			function decode_${type}(bytes memory v) external pure returns (${type}[] memory arr) {
				uint256 ptr = StorageArray.decode(v, ${size}, true);
				assembly { arr := ptr }
			}
		`).join('')}
	}
`});

async function readStorageArray(target, slot, step) {
	if (!step) throw new Error(`invalid step: ${step}`);
	let first = await foundry.provider.getStorage(target, slot);
	let count = ethers.toNumber(first);
	let length = step < 32 ? Math.ceil(count / Math.floor(32 / step)) : ((step + 31) >> 5) * count;
	let start = BigInt(ethers.solidityPackedKeccak256(['uint256'], [slot]));
	return ethers.concat([first, ...await Promise.all(Array.from({length}, (_, i) => foundry.provider.getStorage(target, start + BigInt(i))))]);
}

let packed = await readStorageArray(storage.target, 0, 6);
console.log(packed);
console.log(await storage.decode_uint48(packed));

foundry.shutdown();