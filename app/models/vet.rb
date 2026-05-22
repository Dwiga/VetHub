class Vet < ApplicationRecord
  has_many :users, foreign_key: :vet_id, dependent: :destroy
end
