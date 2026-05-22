class VetInvite < ApplicationRecord
  belongs_to :vet
  belongs_to :user
  enum status: { pending: 0, accepted: 1, rejected: 2 }
end
