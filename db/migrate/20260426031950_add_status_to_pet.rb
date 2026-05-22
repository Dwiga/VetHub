class AddStatusToPet < ActiveRecord::Migration[8.1]
  def change
    add_column :pets, :status, :integer
  end
end
