import hnswlib from 'hnswlib-node'
import fs from 'node:fs/promises'

export class VectorDB {
	constructor(config = {}) {
		this.dim = config.dim || 1024
		this.space = config.space || 'cosine'
		this.maxElements = config.maxElements || 100000

		this.index = new hnswlib.HierarchicalNSW(this.space, this.dim)
		this.index.initIndex(this.maxElements)

		this.metadata = new Map() // Internal map ID (int) -> Object mapping
		this.nextId = 0
	}

	addVector(vector, meta = {}) {
		const arr = Array.isArray(vector) ? vector : Array.from(vector)
		if (arr.length !== this.dim) {
			throw new Error(`Vector dimension mismatch. Expected ${this.dim}, got ${arr.length}`)
		}

		const id = this.nextId++
		this.index.addPoint(arr, id)
		this.metadata.set(id, meta)
		return id
	}

	search(vector, k = 5) {
		if (this.metadata.size === 0) return []
		const arr = Array.isArray(vector) ? vector : Array.from(vector)
		if (arr.length !== this.dim) {
			throw new Error(`Vector dimension mismatch. Expected ${this.dim}, got ${arr.length}`)
		}

		const num = Math.min(k, this.metadata.size)
		const results = this.index.searchKnn(arr, num)

		const output = []
		for (let i = 0; i < results.neighbors.length; i++) {
			const id = results.neighbors[i]
			const distance = results.distances[i]
			const meta = this.metadata.get(id) || {}
			output.push({ ...meta, id, distance })
		}
		return output
	}

	async save(filePath) {
		this.index.writeIndexSync(filePath)

		const metaPath = filePath + '.meta.json'
		const mdJson = {
			nextId: this.nextId,
			dim: this.dim,
			space: this.space,
			maxElements: this.maxElements,
			entries: Array.from(this.metadata.entries()),
		}
		await fs.writeFile(metaPath, JSON.stringify(mdJson))
	}

	async load(filePath) {
		const metaPath = filePath + '.meta.json'
		try {
			await fs.stat(filePath)
		} catch {
			return false // No file to load
		}

		const metaContent = await fs.readFile(metaPath, 'utf-8').catch(() => '{}')
		const metaObj = JSON.parse(metaContent)
		if (metaObj.dim) this.dim = metaObj.dim
		if (metaObj.space) this.space = metaObj.space
		if (metaObj.maxElements) this.maxElements = metaObj.maxElements

		this.index = new hnswlib.HierarchicalNSW(this.space, this.dim)
		this.index.initIndex(this.maxElements)
		this.index.readIndexSync(filePath)

		this.nextId = metaObj.nextId || 0
		this.metadata = new Map(metaObj.entries || [])
		return true
	}
}
