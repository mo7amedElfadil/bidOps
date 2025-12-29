import { SearchService } from './search.service';
export declare class SearchController {
    private search;
    constructor(search: SearchService);
    find(q: string, req: any): Promise<any>;
}
