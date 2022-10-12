import { type Path } from './globrex';

export const isHidden = /(^|[\\\/])\.[^\\\/\.]/g;
// const readdir = promisify(fs.readdir);
// const stat = promisify(fs.stat);

export type BlobOptions = {
    /**
     * Current working directory, default value is '.'
     */
    cwd?: string;
    /**
     * dot Include dotfile matches 
     */
    dot?: boolean;
    /**
     * absolute Return absolute paths 
     */
    absolute?: boolean;
    /**
     * filesOnly Do not include folders if true
     */
    filesOnly?: boolean;
    /**
     * flush Reset cache object
     */
    flush?: boolean;
};

export type BlobOptionsI = BlobOptions & { cwd: string; };

export interface BlobResults extends Path {
    globstar: string;
}

