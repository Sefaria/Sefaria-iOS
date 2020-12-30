import Sefaria from '../sefaria';

describe('sefaria url', () => {
    test('urlToRef simple', () => {
        const testTitle = 'Genesis';
        Sefaria.booksDict[testTitle] = 1;
        const url = "Genesis.11.1"
        const { ref, title } = Sefaria.urlToRef(url);
        expect(title).toBe(testTitle);
        expect(ref).toBe("Genesis 11:1");
    });
    test('urlToRef complex', () => {
        const testTitle = 'Midrash Tanchuma Buber';
        Sefaria.booksDict[testTitle] = 1;
        const url = "Midrash_Tanchuma_Buber,_Bereshit.11.1"
        const { ref, title } = Sefaria.urlToRef(url);
        expect(title).toBe(testTitle);
        expect(ref).toBe("Midrash Tanchuma Buber, Bereshit 11:1");
    });
});