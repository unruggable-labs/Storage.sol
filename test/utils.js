import {ethers} from 'ethers';

export async function readStorageArray(provider, target, slot, step) {
	if (!step) throw new Error(`invalid step: ${step}`);
	let first = await provider.getStorage(target, slot);
	let count = ethers.toNumber(first);
	let length = step < 32 ? Math.ceil(count / Math.floor(32 / step)) : ((step + 31) >> 5) * count;
	let start = BigInt(ethers.solidityPackedKeccak256(['uint256'], [slot]));
	return ethers.concat([first, ...await Promise.all(Array.from({length}, (_, i) => provider.getStorage(target, start + BigInt(i))))]);
}

export async function readStorageSpan(provider, target, slot, length) {
	return ethers.concat(await Promise.all(Array.from({length}, (_, i) => provider.getStorage(target, slot + BigInt(i)))));
}
