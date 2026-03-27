-- Permite tipo Cartão de crédito (limite vs saldo em um único campo na UI)

ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_account_type_check;

ALTER TABLE accounts ADD CONSTRAINT accounts_account_type_check CHECK (
  account_type IN (
    'CHECKING',
    'CASH',
    'SAVINGS',
    'INVESTMENT',
    'MEAL_VOUCHER',
    'OTHER',
    'CREDIT_CARD'
  )
);
