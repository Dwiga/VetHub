class AddWeightToPet < ActiveRecord::Migration[8.1]
  def change
    add_column :pets, :weight, :float, null: true
  end
end
