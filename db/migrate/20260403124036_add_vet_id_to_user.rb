class AddVetIdToUser < ActiveRecord::Migration[8.1]
  def change
    add_reference :users, :vet, null: true, foreign_key: true
    add_column :users, :vet_role, :integer
  end
end
