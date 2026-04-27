type Phrase = {
    id: string;
    text: string;
};

function getBagKey(group: string) {
    return `athena_phrase_bag:${group}`;
}

export function pickPhrase(group: string, phrases: Phrase[]): string {
    const allIds = phrases.map((p) => p.id);

    let bag: string[] = [];
    try {
        const raw = localStorage.getItem(getBagKey(group));
        bag = raw ? JSON.parse(raw) : [];
    } catch {
        bag = [];
    }

    bag = bag.filter((id) => allIds.includes(id));

    if (bag.length === 0) {
        bag = [...allIds];
    }

    const index = Math.floor(Math.random() * bag.length);
    const pickedId = bag[index];

    bag.splice(index, 1);

    localStorage.setItem(getBagKey(group), JSON.stringify(bag));

    const phrase = phrases.find((p) => p.id === pickedId);

    return phrase?.text ?? "";
}