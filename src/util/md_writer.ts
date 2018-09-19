import * as fse from "fs-extra";
import logger from "src/util/logger";

export class MDWriter {
	private writeStream: fse.WriteStream;

	public async open(dirPath: string, fileName: string) {
		await fse.ensureDir(dirPath);
		this.writeStream = await fse.createWriteStream(`${dirPath}/${fileName}`);
	}

	public close() {
		this.writeStream.end();
		this.writeStream = null;
	}

	public write(line?: string) {
		line = line || ``;
		logger.debug(line);
		this.writeStream.write(`${line}\n`);
	}

	public writeQuoted(line?: string) {
		line = line || ``;
		this.write(`> ${line}`);
	}

	public writeLn(line?: string) {
		line = line || ``;
		this.write(`${line}<br/>`);
	}

	public writeLnQuoted(line?: string) {
		line = line || ``;
		this.write(`> ${line}<br/>`);
	}

	public writeHeader(line: string, rank: number) {
		let formatted = new Array(rank + 1).join(`#`);
		formatted += ` ${line}`;
		this.write(`${formatted}`);
	}

	public writeDivider() {
		this.write();
		this.write(`---`);
	}

	public writeTableRow(...fields: string[]) {
		let line = `|`;
		for (const field of fields) {
			line += `${field}|`;
		}
		this.write(line);
	}

	public writeTableHeader(...fields: string[]) {
		this.write();
		this.writeTableRow(...fields);
	}

	public writeTableRowQuoted(...fields: string[]) {
		let line = `> |`;
		for (const field of fields) {
			line += `${field}|`;
		}
		this.write(line);
	}

	public writeTableHeaderQuoted(...fields: string[]) {
		this.write();
		this.writeTableRowQuoted(...fields);
	}
}
