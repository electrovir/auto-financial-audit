import {ParsedOutput, ParsedTransaction} from '..';
import {createStatementParser} from '../parser-base/statement-parser';
import {sanitizeNumberString} from '../util/string';

enum State {
    Header = 'header',
    InnerState = 'inner-state',
    End = 'end',
}

export const exampleStatementParser = createStatementParser<State, ParsedOutput>({
    action: performStateAction,
    next: nextState,
    initialState: State.Header,
    endState: State.End,
    parserKeywords: [],
});

const validPaymentRegex = /(\d{2}\/\d{2})\s+(.+)\$([-,.\d]+)/;

function readPayment(line: string): ParsedTransaction | undefined {
    const match = line.match(validPaymentRegex);

    if (match) {
        const [, dateString, descriptionString, amountString] = match;
        return {
            amount: Number(sanitizeNumberString(amountString)),
            description: descriptionString,
            date: new Date(dateString),
        };
    } else {
        return undefined;
    }
}

function performStateAction(
    currentState: State,
    line: string,
    yearPrefix: number,
    output: ParsedOutput,
) {
    if (currentState === State.InnerState && line.match(validPaymentRegex)) {
        const transaction = readPayment(line);
        if (transaction) {
            output.incomes.push(transaction);
        }
    }

    return output;
}

function nextState(currentState: State, line: string): State {
    line = line.toLowerCase();

    switch (currentState) {
        case State.Header:
            return State.InnerState;
        case State.InnerState:
            if (line === 'end inner state') {
                return State.End;
            }
            break;
        case State.End:
            break;
    }

    return currentState;
}
