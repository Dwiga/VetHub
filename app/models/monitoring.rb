class Monitoring < ApplicationRecord
  # Disable Single Table Inheritance
  self.inheritance_column = nil

  belongs_to :pet
  enum :type, { weight: 0, temperature: 1, vaccination: 2 }
end
