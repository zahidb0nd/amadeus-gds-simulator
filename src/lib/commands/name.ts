import { updatePnrDraft } from '../gds-store';
import type { CommandHandler } from './types';

export const nameCommand: CommandHandler = {
  name: 'NM',
  match(input) {
    return /^NM1.*$/.test(input);
  },
  async execute(context) {
    // AST Payload extraction from normalizedInput
    const match = context.normalizedInput.match(/^NM1([A-Z0-9]+)\/([A-Z0-9\s]+)$/);

    if (!match) {
      return {
        ok: false,
        command: 'NM',
        echo: context.normalizedInput,
        output: 'INVALID FORMAT'
      };
    }

    const surname = match[1];
    const firstAndTitleRaw = match[2];
    
    let firstname = firstAndTitleRaw;
    let title = '';

    if (firstAndTitleRaw.includes(' ')) {
      const parts = firstAndTitleRaw.split(' ');
      firstname = parts[0];
      title = parts.slice(1).join(' ');
    } else {
      // Handle cases like JANEMS
      const commonTitles = ['MRS', 'MISS', 'MSTR', 'REV', 'MR', 'MS', 'DR'];
      for (const t of commonTitles) {
        if (firstAndTitleRaw.endsWith(t)) {
          title = t;
          firstname = firstAndTitleRaw.slice(0, -t.length);
          break;
        }
      }
    }

    const parsedPayload = {
      commandType: 'NM1',
      lastName: surname,
      firstName: firstname,
      title: title
    };

    let newPassengerCount = 0;

    await updatePnrDraft(context.sessionId, (draft) => {
      newPassengerCount = draft.names.length + 1;
      const passenger: any = { surname: parsedPayload.lastName, firstname: parsedPayload.firstName };
      if (parsedPayload.title) {
        passenger.title = parsedPayload.title;
      }
      return {
        ...draft,
        names: [...draft.names, passenger]
      };
    });

    const titleStr = parsedPayload.title ? ` ${parsedPayload.title}` : '';
    const formattedName = `${parsedPayload.lastName}/${parsedPayload.firstName}${titleStr}`;

    return {
      ok: true,
      command: 'NM',
      echo: context.normalizedInput,
      output: `1.${newPassengerCount}${formattedName}`
    };
  }
};