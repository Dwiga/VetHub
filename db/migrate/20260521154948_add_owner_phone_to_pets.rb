class AddOwnerPhoneToPets < ActiveRecord::Migration[8.1]
  def change
    add_column :pets, :owner_phone, :string
    add_index :pets, :owner_phone
    change_column_null :pets, :user_id, true
  end
end
