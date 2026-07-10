import { type FormEvent, useEffect, useState } from 'react';
import type { MessageRecord, RpDateTimeFormat, RpWeekdayLanguage } from '../types';
import type { StorybookCharacter } from '../storybook/runtime';
import {
  bankTransactionsForCharacter,
  bankingBalanceForCharacter,
  bankingRecipientNamesForCharacter,
  formatBankingAmount,
} from '../chat/bankTransfers';
import { dummyBankTransactions } from '../chat/bankingDummyTransactions';
import { normalizePhoneName } from '../chat/phoneMessages';
import { formatRpDateTimeParts } from '../workflow';
import { CharacterAvatar } from './CharacterAvatar';

type PhoneBankingScreenProps = {
  owner?: StorybookCharacter;
  storyCharacters: StorybookCharacter[];
  characterColors: Map<string, string>;
  bankTransferMessages: MessageRecord[];
  bankingContactNames: string[];
  clockDateTime: string;
  rpDateTimeFormat: RpDateTimeFormat;
  rpWeekdayLanguage: RpWeekdayLanguage;
  sendLocked: boolean;
  isRunning: boolean;
  onBack: () => void;
  onAddBankingContact: (characterId: string, contactName: string) => void;
  onSendBankTransfer: (request: {
    from: StorybookCharacter;
    to: string;
    amount: number;
    note: string;
  }) => void;
};

export function PhoneBankingScreen({
  owner,
  storyCharacters,
  characterColors,
  bankTransferMessages,
  bankingContactNames,
  clockDateTime,
  rpDateTimeFormat,
  rpWeekdayLanguage,
  sendLocked,
  isRunning,
  onBack,
  onAddBankingContact,
  onSendBankTransfer,
}: PhoneBankingScreenProps) {
  const [recipientKey, setRecipientKey] = useState<string>();
  const [addingRecipient, setAddingRecipient] = useState(false);
  const [newRecipientName, setNewRecipientName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [note, setNote] = useState('');
  const balance = owner ? bankingBalanceForCharacter(owner, bankTransferMessages) : 0;
  const transactions = owner
    ? bankTransactionsForCharacter(owner, bankTransferMessages)
    : [];
  const recipientNames = owner
    ? bankingRecipientNamesForCharacter(
        owner,
        storyCharacters,
        bankTransferMessages,
        bankingContactNames,
      )
    : [];
  const recipients = recipientNames.map((name) => ({
    key: normalizePhoneName(name),
    name,
    character: storyCharacters.find(
      (character) => normalizePhoneName(character.name) === normalizePhoneName(name),
    ),
  }));
  const recipient = recipients.find((entry) => entry.key === recipientKey);
  const dummyTransactions = owner ? dummyBankTransactions(owner, clockDateTime) : [];
  // Merge real transfers and the generated opening history into one list,
  // newest first. Transfers without an RP timestamp stay on top.
  const transactionRows = [
    ...transactions.map((transaction) => ({
      kind: 'transfer' as const,
      rpDateTime: transaction.message.rpDateTime ?? '9999-12-31T23:59',
      transaction,
    })),
    ...dummyTransactions.map((transaction) => ({
      kind: 'dummy' as const,
      rpDateTime: transaction.rpDateTime,
      transaction,
    })),
  ].sort((left, right) => right.rpDateTime.localeCompare(left.rpDateTime));
  const amount = Math.round(Number(amountText) * 100) / 100;
  const amountValid = Number.isFinite(amount) && amount > 0;
  const insufficientBalance = amountValid && amount > balance;
  const canSend =
    !!owner && !!recipient && amountValid && !insufficientBalance && !sendLocked && !isRunning;
  const sendHint = sendLocked
    ? 'Sending is locked for the Narrator. Select a character to send money.'
    : insufficientBalance
      ? 'Not enough balance for this amount.'
      : undefined;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onBack();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  function sendTransfer() {
    if (!canSend || !owner || !recipient) {
      return;
    }
    onSendBankTransfer({ from: owner, to: recipient.name, amount, note });
    setRecipientKey(undefined);
    setAmountText('');
    setNote('');
  }

  function addRecipient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!owner) {
      return;
    }
    const name = newRecipientName.trim().replace(/\s+/g, ' ');
    const key = normalizePhoneName(name);
    if (!name || !key || key === normalizePhoneName(owner.name)) {
      return;
    }
    onAddBankingContact(owner.id, name);
    setRecipientKey(key);
    setNewRecipientName('');
    setAddingRecipient(false);
  }

  return (
    <div className="phone-banking-screen" aria-label="Banking">
      <header className="phone-gallery-header">
        <button type="button" onClick={onBack} aria-label="Back" title="Back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div>
          <span>Banking</span>
          <strong>{owner ? `${owner.name}'s Account` : 'No Account'}</strong>
        </div>
      </header>
      <div className="phone-banking-scroll">
        <section className="phone-banking-balance-card">
          <span className="phone-banking-balance-label">Balance</span>
          <strong className="phone-banking-balance-amount">{formatBankingAmount(balance)}</strong>
          {owner && <span className="phone-banking-balance-owner">{owner.name}</span>}
        </section>
        <section className="phone-banking-section" aria-label="Send money">
          <div className="phone-banking-section-heading">
            <h4>Send Money</h4>
            <button
              type="button"
              className="phone-banking-add-recipient-button"
              onClick={() => setAddingRecipient((current) => !current)}
              disabled={!owner}
              aria-expanded={addingRecipient}
            >
              {addingRecipient ? 'Cancel' : '+ Add Recipient'}
            </button>
          </div>
          {addingRecipient && (
            <form className="phone-banking-add-recipient" onSubmit={addRecipient}>
              <label className="phone-banking-field">
                <span>Recipient name</span>
                <input
                  type="text"
                  placeholder="First and last name"
                  value={newRecipientName}
                  onChange={(event) => setNewRecipientName(event.target.value)}
                  autoFocus
                />
              </label>
              <button
                type="submit"
                className="phone-banking-contact-save-button"
                disabled={!newRecipientName.trim()}
              >
                Add
              </button>
            </form>
          )}
          <div className="phone-banking-recipients">
            {recipients.map((entry) => {
              const color = characterColors.get(entry.character?.name ?? entry.name);
              return (
                <button
                  type="button"
                  key={entry.key}
                  className={`phone-banking-recipient${recipientKey === entry.key ? ' active' : ''}`}
                  onClick={() => setRecipientKey(entry.key)}
                  aria-pressed={recipientKey === entry.key}
                >
                  <CharacterAvatar
                    className="phone-avatar"
                    name={entry.name}
                    fallback={entry.name.slice(0, 1).toUpperCase()}
                    profileImageDataUrl={entry.character?.profileImage?.dataUrl}
                    style={color ? { borderColor: color, color } : undefined}
                  />
                  <span>{entry.name}</span>
                </button>
              );
            })}
            {recipients.length === 0 && (
              <span className="phone-banking-empty">Add a recipient or receive a transfer first.</span>
            )}
          </div>
          <label className="phone-banking-field">
            <span>Amount ($)</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={amountText}
              onChange={(event) => setAmountText(event.target.value)}
            />
          </label>
          <label className="phone-banking-field">
            <span>Note (optional)</span>
            <input
              type="text"
              placeholder="What is it for?"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="phone-banking-send-button"
            disabled={!canSend}
            onClick={sendTransfer}
          >
            {isRunning ? 'Sending...' : 'Send'}
          </button>
          {sendHint && <span className="phone-banking-hint">{sendHint}</span>}
        </section>
        <section className="phone-banking-section" aria-label="Transactions">
          <h4>Transactions</h4>
          {transactionRows.length > 0 ? (
            <ul className="phone-banking-transactions">
              {transactionRows.map((row) => {
                if (row.kind === 'transfer') {
                  const { transaction } = row;
                  const timeParts = transaction.message.rpDateTime
                    ? formatRpDateTimeParts(transaction.message.rpDateTime, rpDateTimeFormat, rpWeekdayLanguage)
                    : undefined;
                  const timeStr = timeParts ? `${timeParts.date} ${timeParts.time}` : undefined;
                  return (
                    <li className="phone-banking-transaction" key={`transfer-${transaction.message.id}`}>
                      <div className="phone-banking-transaction-info">
                        <strong className="phone-banking-transaction-title">
                          {transaction.direction === 'sent' ? 'To' : 'From'} {transaction.counterpartyName}
                        </strong>
                        {transaction.transfer.note && (
                          <span className="phone-banking-transaction-note">
                            {transaction.transfer.note}
                          </span>
                        )}
                      </div>
                      <div className="phone-banking-transaction-values">
                        <span className={`phone-banking-transaction-amount ${transaction.direction}`}>
                          {transaction.direction === 'sent' ? '-' : '+'}
                          {formatBankingAmount(transaction.transfer.amount)}
                        </span>
                        {timeStr && (
                          <small className="phone-banking-transaction-time">
                            {timeStr}
                          </small>
                        )}
                      </div>
                    </li>
                  );
                }
                const { transaction } = row;
                const timeParts = formatRpDateTimeParts(
                  transaction.rpDateTime,
                  rpDateTimeFormat,
                  rpWeekdayLanguage,
                );
                const timeStr = timeParts ? `${timeParts.date} ${timeParts.time}` : undefined;
                return (
                  <li className="phone-banking-transaction" key={transaction.id}>
                    <div className="phone-banking-transaction-info">
                      <strong className="phone-banking-transaction-title">{transaction.label}</strong>
                    </div>
                    <div className="phone-banking-transaction-values">
                      <span className="phone-banking-transaction-amount sent">
                        -{formatBankingAmount(transaction.amount)}
                      </span>
                      {timeStr && (
                        <small className="phone-banking-transaction-time">
                          {timeStr}
                        </small>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <span className="phone-banking-empty">No transactions yet.</span>
          )}
        </section>
      </div>
    </div>
  );
}
