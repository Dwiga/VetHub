class AddWeightTemeratureToPet < ActiveRecord::Migration[8.1]
  def change
    add_column :pets, :temperature, :float
  end
end
