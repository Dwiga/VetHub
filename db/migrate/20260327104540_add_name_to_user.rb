class AddNameToUser < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :name, :string
    add_column :users, :address, :string
    add_column :users, :phone_number, :string, null: false
    add_index :users, :phone_number, unique: true
  end
end
