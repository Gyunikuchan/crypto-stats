import * as fs from "fs";
import logger from "./logger";

export class MDWriter {
	private writeStream: fs.WriteStream;

	public open(path: string) {
		this.writeStream = fs.createWriteStream(path);
	}

	public close() {
		this.writeStream.end();
		this.writeStream = null;
	}

	public write(line?: string) {
		line = line || ``;
		logger.info(line);
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
